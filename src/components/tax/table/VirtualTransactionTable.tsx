'use client';

import React, { useState, useMemo, useCallback, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Edit2, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import { formatFullCurrency, formatKoreanDate, getTransactionTypeColor, getPaymentStatusColor } from '@/lib/utils/tax-formatters';
import useTaxStore from '@/lib/stores/taxStore';

interface VirtualTransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  height?: number;
}

type SortField = 'transaction_date' | 'supplier_name' | 'total_amount' | 'transaction_type';
type SortOrder = 'asc' | 'desc';

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 48;

export default function VirtualTransactionTable({
  transactions,
  loading = false,
  hasMore = false,
  loadMore,
  onEdit,
  onDelete,
  height = 600
}: VirtualTransactionTableProps) {
  const { 
    selectedTransactions,
    selectTransaction,
    deselectTransaction,
    selectAllTransactions,
    clearSelection 
  } = useTaxStore();

  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Transaction>>({});

  // 정렬된 거래 목록
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'transaction_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'total_amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [transactions, sortField, sortOrder]);

  // 무한 스크롤 아이템 개수
  const itemCount = hasMore ? sortedTransactions.length + 1 : sortedTransactions.length;

  // 아이템 로드 여부 확인
  const isItemLoaded = (index: number) => !hasMore || index < sortedTransactions.length;

  // 더 많은 아이템 로드
  const loadMoreItems = loadMore || (() => Promise.resolve());

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 선택 토글
  const toggleSelection = (id: string) => {
    if (selectedTransactions.includes(id)) {
      deselectTransaction(id);
    } else {
      selectTransaction(id);
    }
  };

  // 인라인 편집 시작
  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditedData({
      supplier_name: transaction.supplier_name,
      supply_amount: transaction.supply_amount,
      vat_amount: transaction.vat_amount,
      total_amount: transaction.total_amount
    });
  };

  // 인라인 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditedData({});
  };

  // 인라인 편집 저장
  const saveEditing = async () => {
    if (editingId && onEdit) {
      const transaction = sortedTransactions.find(t => t.id === editingId);
      if (transaction) {
        await onEdit({ ...transaction, ...editedData });
      }
    }
    setEditingId(null);
    setEditedData({});
  };

  // 행 렌더러
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    // 로딩 행
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center border-b border-border-light">
          <Typography variant="body2" className="text-txt-tertiary">
            로딩 중...
          </Typography>
        </div>
      );
    }

    const transaction = sortedTransactions[index];
    if (!transaction) return null;

    const isEditing = editingId === transaction.id;
    const isSelected = selectedTransactions.includes(transaction.id);
    const typeColor = getTransactionTypeColor(transaction.transaction_type);
    const statusColor = getPaymentStatusColor(transaction.payment_status || 'pending');

    return (
      <div 
        style={style}
        className={`flex items-center border-b border-border-light hover:bg-bg-secondary transition-colors ${
          isSelected ? 'bg-blue-50' : ''
        }`}
      >
        {/* 체크박스 */}
        <div className="w-12 flex-shrink-0 px-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(transaction.id)}
            className="w-4 h-4 text-weave-primary bg-white border-gray-300 rounded focus:ring-weave-primary"
          />
        </div>

        {/* 날짜 */}
        <div className="w-32 flex-shrink-0 px-3">
          <Typography variant="body2" className="text-txt-primary text-sm">
            {formatKoreanDate(transaction.transaction_date)}
          </Typography>
        </div>

        {/* 구분 */}
        <div className="w-20 flex-shrink-0 px-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor.bg} ${typeColor.text}`}>
            {transaction.transaction_type}
          </span>
        </div>

        {/* 거래처 */}
        <div className="flex-1 min-w-0 px-3">
          {isEditing ? (
            <input
              type="text"
              value={editedData.supplier_name || ''}
              onChange={(e) => setEditedData({ ...editedData, supplier_name: e.target.value })}
              className="w-full px-2 py-1 border border-weave-primary rounded text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Typography variant="body2" className="text-txt-primary text-sm truncate">
              {transaction.supplier_name}
            </Typography>
          )}
        </div>

        {/* 공급가액 */}
        <div className="w-32 flex-shrink-0 px-3 text-right">
          {isEditing ? (
            <input
              type="number"
              value={editedData.supply_amount || 0}
              onChange={(e) => {
                const supply = Number(e.target.value);
                const vat = Math.round(supply * 0.1);
                setEditedData({ 
                  ...editedData, 
                  supply_amount: supply,
                  vat_amount: vat,
                  total_amount: supply + vat
                });
              }}
              className="w-full px-2 py-1 border border-weave-primary rounded text-sm text-right"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Typography variant="body2" className="text-txt-primary text-sm">
              {formatFullCurrency(Number(transaction.supply_amount))}
            </Typography>
          )}
        </div>

        {/* 부가세 */}
        <div className="w-28 flex-shrink-0 px-3 text-right">
          <Typography variant="body2" className="text-txt-primary text-sm">
            {formatFullCurrency(Number(editedData.vat_amount || transaction.vat_amount))}
          </Typography>
        </div>

        {/* 합계 */}
        <div className="w-32 flex-shrink-0 px-3 text-right">
          <Typography variant="body2" className="font-semibold text-txt-primary text-sm">
            {formatFullCurrency(Number(editedData.total_amount || transaction.total_amount))}
          </Typography>
        </div>

        {/* 상태 */}
        <div className="w-20 flex-shrink-0 px-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
            {statusColor.label}
          </span>
        </div>

        {/* 액션 */}
        <div className="w-24 flex-shrink-0 px-3">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveEditing();
                }}
                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="저장"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(transaction);
                }}
                className="p-1 text-txt-secondary hover:text-weave-primary hover:bg-bg-secondary rounded transition-colors"
                title="편집"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(transaction.id);
                }}
                className="p-1 text-txt-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center bg-bg-secondary border-b border-border-light" style={{ height: HEADER_HEIGHT }}>
        <div className="w-12 flex-shrink-0 px-3">
          <input
            type="checkbox"
            checked={selectedTransactions.length === transactions.length && transactions.length > 0}
            onChange={() => {
              if (selectedTransactions.length === transactions.length) {
                clearSelection();
              } else {
                selectAllTransactions();
              }
            }}
            className="w-4 h-4 text-weave-primary bg-white border-gray-300 rounded focus:ring-weave-primary"
          />
        </div>
        <div className="w-32 flex-shrink-0 px-3">
          <button
            onClick={() => handleSort('transaction_date')}
            className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary text-sm"
          >
            날짜
            {sortField === 'transaction_date' && (
              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="w-20 flex-shrink-0 px-3">
          <button
            onClick={() => handleSort('transaction_type')}
            className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary text-sm"
          >
            구분
            {sortField === 'transaction_type' && (
              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0 px-3">
          <button
            onClick={() => handleSort('supplier_name')}
            className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary text-sm"
          >
            거래처
            {sortField === 'supplier_name' && (
              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="w-32 flex-shrink-0 px-3 text-right">
          <Typography variant="body2" className="font-semibold text-txt-secondary text-sm">
            공급가액
          </Typography>
        </div>
        <div className="w-28 flex-shrink-0 px-3 text-right">
          <Typography variant="body2" className="font-semibold text-txt-secondary text-sm">
            부가세
          </Typography>
        </div>
        <div className="w-32 flex-shrink-0 px-3 text-right">
          <button
            onClick={() => handleSort('total_amount')}
            className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary text-sm ml-auto"
          >
            합계
            {sortField === 'total_amount' && (
              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="w-20 flex-shrink-0 px-3">
          <Typography variant="body2" className="font-semibold text-txt-secondary text-sm">
            상태
          </Typography>
        </div>
        <div className="w-24 flex-shrink-0 px-3">
          <Typography variant="body2" className="font-semibold text-txt-secondary text-sm text-center">
            작업
          </Typography>
        </div>
      </div>

      {/* 가상 스크롤 리스트 */}
      {sortedTransactions.length > 0 ? (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={height - HEADER_HEIGHT}
              itemCount={itemCount}
              itemSize={ROW_HEIGHT}
              onItemsRendered={onItemsRendered}
              width="100%"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      ) : (
        <div className="p-8 text-center">
          <Typography variant="body1" className="text-txt-tertiary">
            거래 내역이 없습니다
          </Typography>
        </div>
      )}

      {/* 선택된 항목 액션 바 */}
      {selectedTransactions.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
          <Typography variant="body2" className="text-blue-700">
            {selectedTransactions.length}개 항목 선택됨
          </Typography>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              선택 해제
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`${selectedTransactions.length}개 항목을 삭제하시겠습니까?`)) {
                  selectedTransactions.forEach(id => onDelete?.(id));
                  clearSelection();
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              일괄 삭제
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}