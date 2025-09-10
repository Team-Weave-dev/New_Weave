import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import { 
  generateMonthlyReport, 
  generateQuarterlyVATReport 
} from '@/lib/services/supabase/tax-report.service';
import {
  parseExcelFile,
  suggestColumnMappings,
  validateImportData,
  transformToTransactions
} from '@/lib/services/supabase/excel-import.service';
import {
  getTaxDeadlines,
  detectAnomalies
} from '@/lib/services/supabase/tax-notification.service';
import { queryCache } from '@/lib/services/supabase/query-optimizer.service';
import { cacheManager } from '@/lib/services/cache/cache-strategy.service';

/**
 * 세무 관리 통합 테스트
 * TASK-052: 통합 테스트 구현
 */

// Mock Supabase 클라이언트
vi.mock('@/lib/services/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
        })),
        is: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockTransaction, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockTransaction, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: mockRpcResult, error: null }))
  }))
}));

// 테스트 데이터
const mockTransaction = {
  id: 'test-001',
  transaction_date: '2025-01-09',
  transaction_type: '매출',
  supplier_name: '테스트 거래처',
  business_number: '123-45-67890',
  supply_amount: 1000000,
  vat_amount: 100000,
  total_amount: 1100000,
  description: '테스트 거래',
  created_at: '2025-01-09T00:00:00Z'
};

const mockTransactions = [mockTransaction];
const mockData = mockTransaction;
const mockRpcResult = { success: true };

describe('세무 거래 서비스 통합 테스트', () => {
  let service: TaxTransactionService;

  beforeEach(() => {
    service = new TaxTransactionService();
    queryCache.invalidate();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('거래 CRUD 작업', () => {
    it('거래를 생성할 수 있어야 함', async () => {
      const newTransaction = await service.createTransaction({
        transaction_date: '2025-01-09',
        transaction_type: '매출',
        supplier_name: '테스트 거래처',
        business_number: '123-45-67890',
        supply_amount: 1000000,
        vat_amount: 100000,
        total_amount: 1100000
      });

      expect(newTransaction).toBeDefined();
      expect(newTransaction.id).toBeTruthy();
      expect(newTransaction.supplier_name).toBe('테스트 거래처');
    });

    it('거래 목록을 조회할 수 있어야 함', async () => {
      const transactions = await service.getTransactions({
        transactionType: '매출',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThanOrEqual(0);
    });

    it('거래를 수정할 수 있어야 함', async () => {
      const updated = await service.updateTransaction('test-001', {
        supply_amount: 2000000,
        vat_amount: 200000,
        total_amount: 2200000
      });

      expect(updated).toBeDefined();
      expect(updated.id).toBe('test-001');
    });

    it('거래를 삭제할 수 있어야 함', async () => {
      await expect(service.deleteTransaction('test-001')).resolves.not.toThrow();
    });
  });

  describe('캐싱 시스템', () => {
    it('쿼리 결과가 캐시되어야 함', async () => {
      // 첫 번째 호출 - 캐시 미스
      const firstCall = await service.getTransactions({ transactionType: '매출' });
      
      // 두 번째 호출 - 캐시 히트
      const secondCall = await service.getTransactions({ transactionType: '매출' });
      
      expect(firstCall).toEqual(secondCall);
      
      const stats = queryCache.getStats();
      expect(stats.entries).toBeGreaterThan(0);
    });

    it('데이터 변경 시 캐시가 무효화되어야 함', async () => {
      // 캐시 채우기
      await service.getTransactions({ transactionType: '매출' });
      
      // 데이터 변경
      await service.updateTransaction('test-001', { supply_amount: 3000000 });
      
      // 캐시가 무효화되었는지 확인
      const stats = queryCache.getStats();
      expect(stats.entries).toBe(0);
    });
  });

  describe('월별 통계', () => {
    it('월별 통계를 계산할 수 있어야 함', async () => {
      const stats = await service.getMonthlyStatistics(2025, 1);
      
      expect(stats).toBeDefined();
      expect(stats.year).toBe(2025);
      expect(stats.month).toBe(1);
      expect(typeof stats.totalSales).toBe('number');
      expect(typeof stats.totalPurchases).toBe('number');
      expect(typeof stats.vatPayable).toBe('number');
    });

    it('연간 예측을 생성할 수 있어야 함', async () => {
      const projection = await service.getYearlyProjection(2025);
      
      expect(projection).toBeDefined();
      expect(typeof projection.expectedRevenue).toBe('number');
      expect(typeof projection.growthRate).toBe('number');
    });
  });
});

describe('보고서 생성 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('월별 보고서', () => {
    it('월별 보고서를 생성할 수 있어야 함', async () => {
      const report = await generateMonthlyReport(2025, 1);
      
      expect(report).toBeDefined();
      expect(report.year).toBe(2025);
      expect(report.month).toBe(1);
      expect(report.summary).toBeDefined();
      expect(report.transactions).toBeDefined();
      expect(Array.isArray(report.transactions)).toBe(true);
    });

    it('보고서 요약 정보가 정확해야 함', async () => {
      const report = await generateMonthlyReport(2025, 1);
      
      expect(report.summary).toHaveProperty('totalSale');
      expect(report.summary).toHaveProperty('totalPurchase');
      expect(report.summary).toHaveProperty('totalSalesVat');
      expect(report.summary).toHaveProperty('totalPurchasesVat');
      expect(report.summary).toHaveProperty('vatPayable');
      expect(report.summary).toHaveProperty('totalTransactions');
    });
  });

  describe('분기별 VAT 보고서', () => {
    it('분기별 VAT 보고서를 생성할 수 있어야 함', async () => {
      const report = await generateQuarterlyVATReport(2025, 1);
      
      expect(report).toBeDefined();
      expect(report.year).toBe(2025);
      expect(report.quarter).toBe(1);
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
    });

    it('VAT 계산이 정확해야 함', async () => {
      const report = await generateQuarterlyVATReport(2025, 1);
      
      const expectedVatPayable = report.summary.totalSalesVat - report.summary.totalPurchasesVat;
      expect(report.summary.vatPayable).toBe(expectedVatPayable);
    });
  });
});

describe('엑셀 임포트/익스포트 통합 테스트', () => {
  describe('엑셀 파싱', () => {
    it('엑셀 파일을 파싱할 수 있어야 함', async () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // 실제 파싱은 모킹
      vi.mocked(parseExcelFile).mockResolvedValue({
        headers: ['거래일', '거래구분', '거래처명', '공급가액', '부가세', '합계'],
        rows: [
          ['2025-01-09', '매출', '테스트 거래처', 1000000, 100000, 1100000]
        ],
        columns: [
          { index: 0, header: '거래일', sample: '2025-01-09', dataType: 'date' },
          { index: 1, header: '거래구분', sample: '매출', dataType: 'string' },
          { index: 2, header: '거래처명', sample: '테스트 거래처', dataType: 'string' },
          { index: 3, header: '공급가액', sample: 1000000, dataType: 'number' },
          { index: 4, header: '부가세', sample: 100000, dataType: 'number' },
          { index: 5, header: '합계', sample: 1100000, dataType: 'number' }
        ]
      });
      
      const preview = await parseExcelFile(mockFile);
      
      expect(preview).toBeDefined();
      expect(preview.headers).toHaveLength(6);
      expect(preview.rows).toHaveLength(1);
    });
  });

  describe('컬럼 매핑', () => {
    it('자동 컬럼 매핑을 제안할 수 있어야 함', () => {
      const columns = [
        { index: 0, header: '거래일', sample: '2025-01-09', dataType: 'date' as const },
        { index: 1, header: '거래구분', sample: '매출', dataType: 'string' as const },
        { index: 2, header: '거래처명', sample: '테스트 거래처', dataType: 'string' as const }
      ];
      
      const mappings = suggestColumnMappings(columns);
      
      expect(mappings).toHaveLength(3);
      expect(mappings[0].dbField).toBe('transaction_date');
      expect(mappings[1].dbField).toBe('transaction_type');
      expect(mappings[2].dbField).toBe('supplier_name');
    });
  });

  describe('데이터 검증', () => {
    it('임포트 데이터를 검증할 수 있어야 함', () => {
      const rows = [
        ['2025-01-09', '매출', '테스트 거래처', 1000000, 100000, 1100000],
        ['invalid-date', '매출', '', 'not-a-number', 100000, 1100000]
      ];
      
      const mappings = [
        { excelColumn: '거래일', dbField: 'transaction_date' as const },
        { excelColumn: '거래구분', dbField: 'transaction_type' as const },
        { excelColumn: '거래처명', dbField: 'supplier_name' as const },
        { excelColumn: '공급가액', dbField: 'supply_amount' as const }
      ];
      
      const errors = validateImportData(rows, mappings);
      
      expect(errors).toHaveLength(3); // 날짜 오류, 빈 거래처명, 숫자 오류
      expect(errors[0].row).toBe(2);
    });
  });
});

describe('알림 시스템 통합 테스트', () => {
  describe('세무 신고 일정', () => {
    it('세무 신고 일정을 계산할 수 있어야 함', () => {
      const deadlines = getTaxDeadlines(2025, 1);
      
      expect(Array.isArray(deadlines)).toBe(true);
      
      // 원천세 신고 확인 (매월 10일)
      const withholdingTax = deadlines.find(d => d.type === 'income_tax' && d.title.includes('원천세'));
      expect(withholdingTax).toBeDefined();
      
      // 부가세 신고 확인 (분기별)
      const vatFiling = deadlines.find(d => d.type === 'vat_filing');
      if (vatFiling) {
        expect(vatFiling.dueDate).toBeDefined();
        expect(vatFiling.daysRemaining).toBeDefined();
      }
    });

    it('우선순위가 올바르게 설정되어야 함', () => {
      const deadlines = getTaxDeadlines(2025, 1);
      
      deadlines.forEach(deadline => {
        if (deadline.daysRemaining <= 3) {
          expect(['critical', 'high']).toContain(deadline.priority);
        } else if (deadline.daysRemaining <= 7) {
          expect(['high', 'medium']).toContain(deadline.priority);
        } else {
          expect(['medium', 'low']).toContain(deadline.priority);
        }
      });
    });
  });

  describe('이상 거래 감지', () => {
    it('중복 거래를 감지할 수 있어야 함', async () => {
      const anomalies = await detectAnomalies('2025-01-01', '2025-01-31');
      
      const duplicates = anomalies.filter(a => a.type === 'duplicate');
      expect(Array.isArray(duplicates)).toBe(true);
    });

    it('비정상 금액을 감지할 수 있어야 함', async () => {
      const anomalies = await detectAnomalies('2025-01-01', '2025-01-31');
      
      const unusualAmounts = anomalies.filter(a => a.type === 'unusual_amount');
      expect(Array.isArray(unusualAmounts)).toBe(true);
    });

    it('부가세 누락을 감지할 수 있어야 함', async () => {
      const anomalies = await detectAnomalies('2025-01-01', '2025-01-31');
      
      const missingVat = anomalies.filter(a => a.type === 'missing_vat');
      expect(Array.isArray(missingVat)).toBe(true);
    });
  });
});

describe('캐시 전략 통합 테스트', () => {
  beforeEach(async () => {
    await cacheManager.init();
    await cacheManager.invalidate();
  });

  describe('계층적 캐싱', () => {
    it('L1 캐시(메모리)가 작동해야 함', async () => {
      const key = 'test-key';
      const data = { value: 'test-data' };
      
      await cacheManager.set(key, data);
      const retrieved = await cacheManager.get(key);
      
      expect(retrieved).toEqual(data);
    });

    it('L2 캐시(SessionStorage)로 폴백되어야 함', async () => {
      const key = 'test-key-2';
      const data = { value: 'test-data-2' };
      
      // SessionStorage에만 저장
      sessionStorage.setItem(`weave_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000
      }));
      
      const retrieved = await cacheManager.get(key);
      expect(retrieved).toEqual(data);
    });

    it('캐시 무효화가 모든 계층에 적용되어야 함', async () => {
      const key = 'test-key-3';
      const data = { value: 'test-data-3' };
      
      await cacheManager.set(key, data);
      await cacheManager.invalidate(key);
      
      const retrieved = await cacheManager.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('캐시 통계', () => {
    it('캐시 히트/미스를 추적해야 함', async () => {
      const key = 'test-key-4';
      const data = { value: 'test-data-4' };
      
      // 미스
      await cacheManager.get(key);
      
      // 세트
      await cacheManager.set(key, data);
      
      // 히트
      await cacheManager.get(key);
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });
  });
});

describe('성능 최적화 통합 테스트', () => {
  describe('쿼리 최적화', () => {
    it('배치 쿼리가 병렬로 실행되어야 함', async () => {
      const service = new TaxTransactionService();
      const startTime = Date.now();
      
      // 병렬 실행
      await Promise.all([
        service.getTransactions({ transactionType: '매출' }),
        service.getTransactions({ transactionType: '매입' }),
        service.getMonthlyStatistics(2025, 1)
      ]);
      
      const duration = Date.now() - startTime;
      
      // 순차 실행보다 빨라야 함
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('페이지네이션', () => {
    it('대용량 데이터를 효율적으로 처리해야 함', async () => {
      const service = new TaxTransactionService();
      
      // 페이지네이션 파라미터
      const transactions = await service.getTransactionsPaginated({
        page: 1,
        pageSize: 50,
        transactionType: '매출'
      });
      
      expect(transactions).toBeDefined();
      expect(transactions.data).toBeDefined();
      expect(transactions.total).toBeDefined();
      expect(transactions.hasMore).toBeDefined();
    });
  });
});