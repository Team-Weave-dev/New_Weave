'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Edit2, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Check,
  X,
  Save,
  Link2
} from 'lucide-react';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import { formatFullCurrency, formatKoreanDate, getTransactionTypeColor, getPaymentStatusColor } from '@/lib/utils/tax-formatters';
import useTaxStore from '@/lib/stores/taxStore';
import ProjectConnectionButton from '../project/ProjectConnectionButton';

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  editable?: boolean;
}

type SortField = 'transaction_date' | 'supplier_name' | 'total_amount' | 'transaction_type';
type SortOrder = 'asc' | 'desc';

export default function TransactionTable({
  transactions,
  loading = false,
  onEdit,
  onDelete,
  selectable = true,
  editable = true
}: TransactionTableProps) {
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

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 전체 선택 핸들러
  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      clearSelection();
    } else {
      selectAllTransactions();
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
      const transaction = transactions.find(t => t.id === editingId);
      if (transaction) {
        await onEdit({ ...transaction, ...editedData });
      }
    }
    setEditingId(null);
    setEditedData({});
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-bg-secondary border-b border-border-light px-4 py-3">
            <div className="flex items-center gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-bg-tertiary rounded w-20"></div>
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border-light px-4 py-3">
              <div className="flex items-center gap-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-4 bg-bg-secondary rounded w-20"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-bg-secondary border-b border-border-light">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-weave-primary bg-white border-gray-300 rounded focus:ring-weave-primary"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('transaction_date')}
                  className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  날짜
                  {renderSortIcon('transaction_date')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('transaction_type')}
                  className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  구분
                  {renderSortIcon('transaction_type')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('supplier_name')}
                  className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  거래처
                  {renderSortIcon('supplier_name')}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <Typography variant="body2" className="font-semibold text-txt-secondary">
                  공급가액
                </Typography>
              </th>
              <th className="px-4 py-3 text-right">
                <Typography variant="body2" className="font-semibold text-txt-secondary">
                  부가세
                </Typography>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('total_amount')}
                  className="flex items-center gap-1 font-semibold text-txt-secondary hover:text-txt-primary transition-colors ml-auto"
                >
                  합계
                  {renderSortIcon('total_amount')}
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <Typography variant="body2" className="font-semibold text-txt-secondary">
                  상태
                </Typography>
              </th>
              <th className="px-4 py-3 text-center">
                <Typography variant="body2" className="font-semibold text-txt-secondary">
                  프로젝트
                </Typography>
              </th>
              {editable && (
                <th className="px-4 py-3 text-center">
                  <Typography variant="body2" className="font-semibold text-txt-secondary">
                    작업
                  </Typography>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction) => {
              const isEditing = editingId === transaction.id;
              const isSelected = selectedTransactions.includes(transaction.id);
              const typeColor = getTransactionTypeColor(transaction.transaction_type);
              const statusColor = getPaymentStatusColor(transaction.payment_status || 'pending');

              return (
                <tr 
                  key={transaction.id}
                  className={`border-b border-border-light hover:bg-bg-secondary transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(transaction.id)}
                        className="w-4 h-4 text-weave-primary bg-white border-gray-300 rounded focus:ring-weave-primary"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Typography variant="body2" className="text-txt-primary">
                      {formatKoreanDate(transaction.transaction_date)}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor.bg} ${typeColor.text}`}>
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.supplier_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, supplier_name: e.target.value })}
                        className="w-full px-2 py-1 border border-weave-primary rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <Typography variant="body2" className="text-txt-primary">
                        {transaction.supplier_name}
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        className="w-24 px-2 py-1 border border-weave-primary rounded text-sm text-right"
                      />
                    ) : (
                      <Typography variant="body2" className="text-txt-primary">
                        {formatFullCurrency(Number(transaction.supply_amount))}
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Typography variant="body2" className="text-txt-primary">
                      {formatFullCurrency(Number(editedData.vat_amount || transaction.vat_amount))}
                    </Typography>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Typography variant="body2" className="font-semibold text-txt-primary">
                      {formatFullCurrency(Number(editedData.total_amount || transaction.total_amount))}
                    </Typography>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
                      {statusColor.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProjectConnectionButton 
                      transaction={transaction}
                      onConnectionChange={() => {
                        // 연결 변경 시 데이터 새로고침
                        window.location.reload();
                      }}
                    />
                  </td>
                  {editable && (
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={saveEditing}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="저장"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="취소"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEditing(transaction)}
                            className="p-1 text-txt-secondary hover:text-weave-primary hover:bg-bg-secondary rounded transition-colors"
                            title="편집"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete?.(transaction.id)}
                            className="p-1 text-txt-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="p-8 text-center">
            <Typography variant="body1" className="text-txt-tertiary">
              거래 내역이 없습니다
            </Typography>
          </div>
        )}
      </div>

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