import { createClient } from '@/lib/services/supabase/client';
import type { Transaction } from './tax-transactions.service';

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    transaction_type?: 'sales' | 'purchase';
    payment_status?: string;
    start_date?: string;
    end_date?: string;
    supplier_name?: string;
    min_amount?: number;
    max_amount?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 페이지네이션을 사용한 거래 내역 조회
 */
export async function fetchTransactionsWithPagination(
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Transaction>> {
  const {
    page = 1,
    pageSize = 20,
    sortField = 'transaction_date',
    sortOrder = 'desc',
    filters = {}
  } = options;

  const supabase = createClient();
  
  // 기본 쿼리 생성
  let query = supabase
    .from('tax_transactions')
    .select('*', { count: 'exact' });

  // 필터 적용
  if (filters.transaction_type) {
    query = query.eq('transaction_type', filters.transaction_type);
  }
  
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  
  if (filters.start_date) {
    query = query.gte('transaction_date', filters.start_date);
  }
  
  if (filters.end_date) {
    query = query.lte('transaction_date', filters.end_date);
  }
  
  if (filters.supplier_name) {
    query = query.ilike('supplier_name', `%${filters.supplier_name}%`);
  }
  
  if (filters.min_amount !== undefined) {
    query = query.gte('total_amount', filters.min_amount);
  }
  
  if (filters.max_amount !== undefined) {
    query = query.lte('total_amount', filters.max_amount);
  }

  // 정렬 적용
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // 페이지네이션 적용
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated transactions:', error);
    throw error;
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  return {
    data: data || [],
    page,
    pageSize,
    totalCount,
    totalPages,
    hasMore
  };
}

/**
 * 커서 기반 무한 스크롤용 거래 내역 조회
 */
export async function fetchTransactionsWithCursor(
  cursor?: string,
  limit: number = 20,
  filters?: PaginationOptions['filters']
): Promise<{
  data: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const supabase = createClient();
  
  let query = supabase
    .from('tax_transactions')
    .select('*');

  // 필터 적용
  if (filters?.transaction_type) {
    query = query.eq('transaction_type', filters.transaction_type);
  }
  
  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  
  if (filters?.start_date) {
    query = query.gte('transaction_date', filters.start_date);
  }
  
  if (filters?.end_date) {
    query = query.lte('transaction_date', filters.end_date);
  }
  
  if (filters?.supplier_name) {
    query = query.ilike('supplier_name', `%${filters.supplier_name}%`);
  }

  // 커서가 있으면 해당 위치부터 조회
  if (cursor) {
    const [date, id] = cursor.split('_');
    query = query.or(`transaction_date.lt.${date},and(transaction_date.eq.${date},id.lt.${id})`);
  }

  // 정렬 및 제한
  query = query
    .order('transaction_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // 다음 페이지 존재 여부 확인용

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions with cursor:', error);
    throw error;
  }

  const transactions = data || [];
  const hasMore = transactions.length > limit;
  
  // 실제 반환할 데이터는 limit 개수만큼만
  const returnData = hasMore ? transactions.slice(0, -1) : transactions;
  
  // 다음 커서 생성
  const lastItem = returnData[returnData.length - 1];
  const nextCursor = lastItem 
    ? `${lastItem.transaction_date}_${lastItem.id}`
    : null;

  return {
    data: returnData,
    nextCursor,
    hasMore
  };
}

/**
 * 무한 스크롤 헬퍼 클래스
 */
export class InfiniteScrollManager {
  private cursor: string | null = null;
  private isLoading = false;
  private hasMore = true;
  private data: Transaction[] = [];
  private filters?: PaginationOptions['filters'];

  constructor(private limit: number = 20) {}

  /**
   * 필터 설정
   */
  setFilters(filters: PaginationOptions['filters']) {
    this.filters = filters;
    this.reset();
  }

  /**
   * 초기화
   */
  reset() {
    this.cursor = null;
    this.hasMore = true;
    this.data = [];
  }

  /**
   * 다음 페이지 로드
   */
  async loadMore(): Promise<Transaction[]> {
    if (this.isLoading || !this.hasMore) {
      return [];
    }

    this.isLoading = true;

    try {
      const result = await fetchTransactionsWithCursor(
        this.cursor || undefined,
        this.limit,
        this.filters
      );

      this.cursor = result.nextCursor;
      this.hasMore = result.hasMore;
      this.data = [...this.data, ...result.data];

      return result.data;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 현재 데이터 가져오기
   */
  getData(): Transaction[] {
    return this.data;
  }

  /**
   * 로딩 상태 확인
   */
  getIsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * 더 많은 데이터 존재 여부
   */
  getHasMore(): boolean {
    return this.hasMore;
  }
}

/**
 * 거래 내역 집계 데이터 조회
 */
export async function fetchTransactionAggregates(
  filters?: PaginationOptions['filters']
): Promise<{
  totalSales: number;
  totalPurchases: number;
  totalVat: number;
  transactionCount: number;
}> {
  const supabase = createClient();
  
  // 매출 집계
  let salesQuery = supabase
    .from('tax_transactions')
    .select('total_amount.sum()')
    .eq('transaction_type', 'sales');

  // 매입 집계
  let purchasesQuery = supabase
    .from('tax_transactions')
    .select('total_amount.sum()')
    .eq('transaction_type', 'purchase');

  // VAT 집계
  let vatQuery = supabase
    .from('tax_transactions')
    .select('vat_amount.sum()');

  // 거래 건수
  let countQuery = supabase
    .from('tax_transactions')
    .select('*', { count: 'exact', head: true });

  // 필터 적용
  if (filters?.start_date) {
    salesQuery = salesQuery.gte('transaction_date', filters.start_date);
    purchasesQuery = purchasesQuery.gte('transaction_date', filters.start_date);
    vatQuery = vatQuery.gte('transaction_date', filters.start_date);
    countQuery = countQuery.gte('transaction_date', filters.start_date);
  }
  
  if (filters?.end_date) {
    salesQuery = salesQuery.lte('transaction_date', filters.end_date);
    purchasesQuery = purchasesQuery.lte('transaction_date', filters.end_date);
    vatQuery = vatQuery.lte('transaction_date', filters.end_date);
    countQuery = countQuery.lte('transaction_date', filters.end_date);
  }

  const [salesResult, purchasesResult, vatResult, countResult] = await Promise.all([
    salesQuery.single(),
    purchasesQuery.single(),
    vatQuery.single(),
    countQuery
  ]);

  return {
    totalSales: salesResult.data?.sum || 0,
    totalPurchases: purchasesResult.data?.sum || 0,
    totalVat: vatResult.data?.sum || 0,
    transactionCount: countResult.count || 0
  };
}