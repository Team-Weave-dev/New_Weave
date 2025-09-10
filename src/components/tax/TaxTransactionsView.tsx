'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Download, 
  Upload,
  Filter,
  LayoutGrid,
  List,
  Smartphone,
  Monitor,
  Link as LinkIcon
} from 'lucide-react';

// 컴포넌트 임포트
import TransactionTable from './table/TransactionTable';
import VirtualTransactionTable from './table/VirtualTransactionTable';
import TransactionCards from './mobile/TransactionCards';
import TransactionFilters from './filters/TransactionFilters';
import TransactionModal from './modals/TransactionModal';
import BatchOperations from './batch/BatchOperations';
import StatisticsCards from './cards/StatisticsCards';
import BatchProjectConnection from './project/BatchProjectConnection';

// 서비스 임포트
import { 
  fetchTransactionsWithPagination,
  InfiniteScrollManager,
  fetchTransactionAggregates
} from '@/lib/services/supabase/tax-pagination.service';
import { 
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '@/lib/services/supabase/tax-transactions.service';
import { 
  exportTransactionsToExcel, 
  exportTransactionsToCSV 
} from '@/lib/utils/tax-export';

// 스토어 임포트
import useTaxStore from '@/lib/stores/taxStore';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

type ViewMode = 'table' | 'virtual' | 'cards';

export default function TaxTransactionsView() {
  const { 
    transactions,
    setTransactions,
    loading,
    setLoading,
    selectedTransactions,
    clearSelection
  } = useTaxStore();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showProjectConnection, setShowProjectConnection] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [aggregates, setAggregates] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalVat: 0,
    transactionCount: 0
  });

  // 무한 스크롤 매니저
  const scrollManager = React.useRef(new InfiniteScrollManager(20));

  // 반응형 처리
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('cards');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 데이터 로드
  const loadTransactions = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const response = await fetchTransactionsWithPagination({
        page: 1,
        pageSize: 50,
        sortField: 'transaction_date',
        sortOrder: 'desc',
        filters
      });
      
      setTransactions(response.data);
      
      // 집계 데이터 로드
      const aggs = await fetchTransactionAggregates(filters);
      setAggregates(aggs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [setTransactions, setLoading]);

  // 초기 데이터 로드
  useEffect(() => {
    loadTransactions();
  }, []);

  // 거래 추가/편집 처리
  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (modalMode === 'add') {
        await createTransaction(data);
      } else if (modalMode === 'edit' && editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      }
      
      setModalMode(null);
      setEditingTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  // 거래 삭제 처리
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;
    
    try {
      await deleteTransaction(id);
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // 일괄 편집 처리
  const handleBatchEdit = async (ids: string[], updates: Partial<Transaction>) => {
    try {
      await Promise.all(
        ids.map(id => updateTransaction(id, updates))
      );
      clearSelection();
      loadTransactions();
    } catch (error) {
      console.error('Error batch editing:', error);
      throw error;
    }
  };

  // 일괄 삭제 처리
  const handleBatchDelete = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(id => deleteTransaction(id))
      );
      clearSelection();
      loadTransactions();
    } catch (error) {
      console.error('Error batch deleting:', error);
      throw error;
    }
  };

  // 내보내기 처리
  const handleExport = (format: 'excel' | 'csv') => {
    const exportData = selectedTransactions.length > 0
      ? transactions.filter(t => selectedTransactions.includes(t.id))
      : transactions;

    if (format === 'excel') {
      exportTransactionsToExcel(exportData);
    } else {
      exportTransactionsToCSV(exportData);
    }
  };

  // 필터 적용
  const handleApplyFilters = (filters: any) => {
    loadTransactions(filters);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h2" className="text-2xl font-bold text-txt-primary">
            매입매출 상세
          </Typography>
          <Typography variant="body2" className="text-txt-secondary mt-1">
            거래 내역을 관리하고 분석합니다
          </Typography>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 뷰 모드 전환 */}
          {!isMobile && (
            <div className="flex items-center bg-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-weave-primary shadow-sm' 
                    : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
                title="테이블 뷰"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('virtual')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'virtual' 
                    ? 'bg-white text-weave-primary shadow-sm' 
                    : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
                title="가상 스크롤 뷰"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 액션 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            통계 {showStats ? '숨기기' : '보기'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjectConnection(!showProjectConnection)}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            프로젝트 연결
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalMode('add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            거래 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {showStats && (
        <StatisticsCards
          totalSales={aggregates.totalSales}
          totalPurchases={aggregates.totalPurchases}
          totalVat={aggregates.totalVat}
          netAmount={aggregates.totalSales - aggregates.totalPurchases}
          transactionCount={aggregates.transactionCount}
          period="전체 기간"
        />
      )}

      {/* 일괄 프로젝트 연결 */}
      {showProjectConnection && (
        <BatchProjectConnection
          transactions={selectedTransactions.length > 0 
            ? transactions.filter(t => selectedTransactions.includes(t.id))
            : transactions}
          onComplete={() => {
            setShowProjectConnection(false);
            clearSelection();
            loadTransactions();
          }}
        />
      )}

      {/* 일괄 작업 */}
      {selectedTransactions.length > 0 && (
        <BatchOperations
          onBatchEdit={handleBatchEdit}
          onBatchDelete={handleBatchDelete}
          onBatchExport={(ids) => {
            const exportData = transactions.filter(t => ids.includes(t.id));
            exportTransactionsToExcel(exportData);
          }}
        />
      )}

      {/* 필터 */}
      <TransactionFilters
        onApply={handleApplyFilters}
        onReset={() => loadTransactions()}
        collapsed={!showFilters}
      />

      {/* 데이터 뷰 */}
      {isMobile || viewMode === 'cards' ? (
        <TransactionCards
          transactions={transactions}
          loading={loading}
          onEdit={(t) => {
            setEditingTransaction(t);
            setModalMode('edit');
          }}
          onDelete={handleDeleteTransaction}
          onLoadMore={async () => {
            const newData = await scrollManager.current.loadMore();
            setTransactions([...transactions, ...newData]);
          }}
          hasMore={scrollManager.current.getHasMore()}
        />
      ) : viewMode === 'virtual' ? (
        <VirtualTransactionTable
          transactions={transactions}
          loading={loading}
          onEdit={(t) => {
            setEditingTransaction(t);
            setModalMode('edit');
          }}
          onDelete={handleDeleteTransaction}
          hasMore={scrollManager.current.getHasMore()}
          loadMore={async () => {
            const newData = await scrollManager.current.loadMore();
            setTransactions([...transactions, ...newData]);
          }}
          height={600}
        />
      ) : (
        <TransactionTable
          transactions={transactions}
          loading={loading}
          onEdit={(t) => {
            setEditingTransaction(t);
            setModalMode('edit');
          }}
          onDelete={handleDeleteTransaction}
        />
      )}

      {/* 거래 추가/편집 모달 */}
      {modalMode && (
        <TransactionModal
          isOpen={!!modalMode}
          onClose={() => {
            setModalMode(null);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          transaction={editingTransaction}
          mode={modalMode}
        />
      )}
    </div>
  );
}