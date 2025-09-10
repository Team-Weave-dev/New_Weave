import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  Transaction, 
  TransactionFilters, 
  YearlyProjection,
  MonthlyTrend,
  MonthlyStatistics
} from '@/lib/services/supabase/tax-transactions.service';

interface TaxState {
  // 거래 데이터
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  
  // 필터 상태
  filters: TransactionFilters;
  
  // 통계 데이터
  yearlyProjection: YearlyProjection | null;
  monthlyTrend: MonthlyTrend[];
  monthlyStatistics: MonthlyStatistics | null;
  
  // 선택된 거래
  selectedTransactions: string[];
  
  // 모달 상태
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingTransaction: Transaction | null;
  
  // 액션
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  
  setYearlyProjection: (projection: YearlyProjection) => void;
  setMonthlyTrend: (trend: MonthlyTrend[]) => void;
  setMonthlyStatistics: (statistics: MonthlyStatistics) => void;
  
  selectTransaction: (id: string) => void;
  deselectTransaction: (id: string) => void;
  selectAllTransactions: () => void;
  clearSelection: () => void;
  
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (transaction: Transaction) => void;
  closeEditModal: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 계산된 값
  getFilteredTransactions: () => Transaction[];
  getTotalAmount: () => { revenue: number; expense: number; net: number };
  getSelectedCount: () => number;
}

const defaultFilters: TransactionFilters = {
  dateRange: 'thisYear',  // 기본값을 올해로 변경하여 2024년 데이터를 볼 수 있도록
  transactionType: 'all',
  projectId: null,
  clientId: null
};

const useTaxStore = create<TaxState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        transactions: [],
        loading: false,
        error: null,
        filters: defaultFilters,
        yearlyProjection: null,
        monthlyTrend: [],
        monthlyStatistics: null,
        selectedTransactions: [],
        isAddModalOpen: false,
        isEditModalOpen: false,
        editingTransaction: null,

        // 거래 관련 액션
        setTransactions: (transactions) => set({ transactions }),
        
        addTransaction: (transaction) => 
          set((state) => ({ 
            transactions: [transaction, ...state.transactions] 
          })),
        
        updateTransaction: (id, updatedData) =>
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, ...updatedData } : t
            )
          })),
        
        deleteTransaction: (id) =>
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
            selectedTransactions: state.selectedTransactions.filter((tid) => tid !== id)
          })),

        // 필터 관련 액션
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters }
          })),
        
        resetFilters: () => set({ filters: defaultFilters }),
        clearFilters: () => set({ filters: defaultFilters }),

        // 통계 관련 액션
        setYearlyProjection: (projection) => set({ yearlyProjection: projection }),
        setMonthlyTrend: (trend) => set({ monthlyTrend: trend }),
        setMonthlyStatistics: (statistics) => set({ monthlyStatistics: statistics }),

        // 선택 관련 액션
        selectTransaction: (id) =>
          set((state) => ({
            selectedTransactions: [...state.selectedTransactions, id]
          })),
        
        deselectTransaction: (id) =>
          set((state) => ({
            selectedTransactions: state.selectedTransactions.filter((tid) => tid !== id)
          })),
        
        selectAllTransactions: () =>
          set((state) => ({
            selectedTransactions: state.transactions.map((t) => t.id)
          })),
        
        clearSelection: () => set({ selectedTransactions: [] }),

        // 모달 관련 액션
        openAddModal: () => set({ isAddModalOpen: true }),
        closeAddModal: () => set({ isAddModalOpen: false }),
        
        openEditModal: (transaction) =>
          set({ isEditModalOpen: true, editingTransaction: transaction }),
        
        closeEditModal: () =>
          set({ isEditModalOpen: false, editingTransaction: null }),

        // 로딩/에러 관련 액션
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // 계산된 값
        getFilteredTransactions: () => {
          const { transactions, filters } = get();
          let filtered = [...transactions];

          // 날짜 범위 필터
          if (filters.dateRange && filters.dateRange !== 'all') {
            const now = new Date();
            let startDate: Date;

            switch (filters.dateRange) {
              case 'thisMonth':
                // Mock 데이터용: 2024년 12월 데이터 표시
                startDate = new Date(2024, 11, 1);  // 2024년 12월 1일
                const endOfMonth = new Date(2024, 11, 31);  // 2024년 12월 31일
                filtered = filtered.filter((t) => {
                  const date = new Date(t.transaction_date);
                  return date >= startDate && date <= endOfMonth;
                });
                break;
              case 'lastMonth':
                // Mock 데이터용: 2024년 11월 데이터 표시
                startDate = new Date(2024, 10, 1);  // 2024년 11월 1일
                const endOfLastMonth = new Date(2024, 10, 30);  // 2024년 11월 30일
                filtered = filtered.filter((t) => {
                  const date = new Date(t.transaction_date);
                  return date >= startDate && date <= endOfLastMonth;
                });
                break;
              case 'thisYear':
                // Mock 데이터용: 2024년 전체 데이터 표시
                startDate = new Date(2024, 0, 1);  // 2024년 1월 1일
                const endOfYear = new Date(2024, 11, 31);  // 2024년 12월 31일
                filtered = filtered.filter((t) => {
                  const date = new Date(t.transaction_date);
                  return date >= startDate && date <= endOfYear;
                });
                break;
              default:
                if (typeof filters.dateRange === 'object' && 'start' in filters.dateRange) {
                  startDate = new Date(filters.dateRange.start);
                  const endDate = new Date(filters.dateRange.end);
                  filtered = filtered.filter((t) => {
                    const date = new Date(t.transaction_date);
                    return date >= startDate && date <= endDate;
                  });
                }
                break;
            }
          }

          // 거래 유형 필터
          if (filters.transactionType && filters.transactionType !== 'all') {
            filtered = filtered.filter((t) => 
              t.transaction_type === filters.transactionType
            );
          }

          // 프로젝트 필터
          if (filters.projectId) {
            filtered = filtered.filter((t) => t.project_id === filters.projectId);
          }

          // 클라이언트 필터
          if (filters.clientId) {
            filtered = filtered.filter((t) => t.client_id === filters.clientId);
          }

          return filtered;
        },

        getTotalAmount: () => {
          const transactions = get().getFilteredTransactions();
          const revenue = transactions
            .filter((t) => t.transaction_type === '매출')
            .reduce((sum, t) => sum + Number(t.total_amount), 0);
          const expense = transactions
            .filter((t) => t.transaction_type === '매입')
            .reduce((sum, t) => sum + Number(t.total_amount), 0);
          
          return {
            revenue,
            expense,
            net: revenue - expense
          };
        },

        getSelectedCount: () => get().selectedTransactions.length
      }),
      {
        name: 'tax-store',
        partialize: (state) => ({
          filters: state.filters
        })
      }
    )
  )
);

export default useTaxStore;