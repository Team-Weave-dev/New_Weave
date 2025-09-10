'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  CheckSquare, 
  Trash2, 
  Edit2, 
  DollarSign,
  FileText,
  Tag,
  Calendar,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import useTaxStore from '@/lib/stores/taxStore';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import { formatFullCurrency } from '@/lib/utils/tax-formatters';

interface BatchOperationsProps {
  onBatchEdit?: (ids: string[], updates: Partial<Transaction>) => Promise<void>;
  onBatchDelete?: (ids: string[]) => Promise<void>;
  onBatchExport?: (ids: string[]) => void;
}

export default function BatchOperations({
  onBatchEdit,
  onBatchDelete,
  onBatchExport
}: BatchOperationsProps) {
  const { 
    selectedTransactions, 
    clearSelection,
    transactions 
  } = useTaxStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [batchEditMode, setBatchEditMode] = useState<string | null>(null);
  const [batchEditData, setBatchEditData] = useState<Partial<Transaction>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // 선택된 거래들의 정보 계산
  const selectedInfo = React.useMemo(() => {
    const selected = transactions.filter(t => 
      selectedTransactions.includes(t.id)
    );

    const totalAmount = selected.reduce((sum, t) => 
      sum + Number(t.total_amount), 0
    );

    const salesCount = selected.filter(t => 
      t.transaction_type === 'sales'
    ).length;

    const purchaseCount = selected.filter(t => 
      t.transaction_type === 'purchase'
    ).length;

    return {
      count: selected.length,
      totalAmount,
      salesCount,
      purchaseCount,
      transactions: selected
    };
  }, [selectedTransactions, transactions]);

  if (selectedTransactions.length === 0) {
    return null;
  }

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    if (!onBatchDelete) return;

    const confirmed = confirm(
      `정말로 ${selectedInfo.count}개의 거래를 삭제하시겠습니까?\n\n` +
      `총 금액: ${formatFullCurrency(selectedInfo.totalAmount)}\n` +
      `매출: ${selectedInfo.salesCount}건 / 매입: ${selectedInfo.purchaseCount}건`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await onBatchDelete(selectedTransactions);
      clearSelection();
    } catch (error) {
      console.error('Batch delete error:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 일괄 편집 처리
  const handleBatchEdit = async () => {
    if (!onBatchEdit || !batchEditMode) return;

    setIsProcessing(true);
    try {
      await onBatchEdit(selectedTransactions, batchEditData);
      setBatchEditMode(null);
      setBatchEditData({});
      clearSelection();
    } catch (error) {
      console.error('Batch edit error:', error);
      alert('일괄 편집 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 일괄 내보내기 처리
  const handleBatchExport = () => {
    if (!onBatchExport) return;
    onBatchExport(selectedTransactions);
  };

  return (
    <Card className="sticky top-0 z-20 shadow-lg border-weave-primary">
      {/* 헤더 */}
      <div 
        className="px-4 py-3 bg-blue-50 border-b border-blue-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <div>
              <Typography variant="body1" className="font-semibold text-blue-900">
                {selectedInfo.count}개 항목 선택됨
              </Typography>
              <Typography variant="body2" className="text-blue-700 text-xs">
                총 {formatFullCurrency(selectedInfo.totalAmount)} | 
                매출 {selectedInfo.salesCount}건 | 
                매입 {selectedInfo.purchaseCount}건
              </Typography>
            </div>
          </div>
          <button className="p-1 hover:bg-blue-100 rounded transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* 본체 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 빠른 작업 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {/* 결제 상태 변경 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBatchEditMode('payment_status');
                setBatchEditData({ payment_status: 'paid' });
              }}
              disabled={isProcessing}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              결제 완료 처리
            </Button>

            {/* 프로젝트 연결 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchEditMode('project')}
              disabled={isProcessing}
            >
              <Tag className="w-4 h-4 mr-2" />
              프로젝트 연결
            </Button>

            {/* 날짜 변경 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchEditMode('date')}
              disabled={isProcessing}
            >
              <Calendar className="w-4 h-4 mr-2" />
              날짜 변경
            </Button>

            {/* 메모 추가 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchEditMode('notes')}
              disabled={isProcessing}
            >
              <FileText className="w-4 h-4 mr-2" />
              메모 추가
            </Button>

            {/* 내보내기 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchExport}
              disabled={isProcessing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Excel 내보내기
            </Button>

            {/* 삭제 */}
            <Button
              variant="danger"
              size="sm"
              onClick={handleBatchDelete}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              일괄 삭제
            </Button>

            {/* 선택 해제 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-2" />
              선택 해제
            </Button>
          </div>

          {/* 일괄 편집 폼 */}
          {batchEditMode && (
            <Card className="p-4 bg-bg-secondary">
              <div className="space-y-3">
                {/* 결제 상태 변경 */}
                {batchEditMode === 'payment_status' && (
                  <div>
                    <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                      결제 상태 일괄 변경
                    </Typography>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBatchEditData({ payment_status: 'pending' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          batchEditData.payment_status === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white text-txt-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        대기
                      </button>
                      <button
                        onClick={() => setBatchEditData({ payment_status: 'paid' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          batchEditData.payment_status === 'paid'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-txt-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        완료
                      </button>
                      <button
                        onClick={() => setBatchEditData({ payment_status: 'overdue' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          batchEditData.payment_status === 'overdue'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-txt-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        연체
                      </button>
                    </div>
                  </div>
                )}

                {/* 날짜 변경 */}
                {batchEditMode === 'date' && (
                  <div>
                    <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                      거래일 일괄 변경
                    </Typography>
                    <input
                      type="date"
                      value={batchEditData.transaction_date || ''}
                      onChange={(e) => setBatchEditData({ transaction_date: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                    />
                  </div>
                )}

                {/* 메모 추가 */}
                {batchEditMode === 'notes' && (
                  <div>
                    <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                      메모 일괄 추가
                    </Typography>
                    <textarea
                      value={batchEditData.notes || ''}
                      onChange={(e) => setBatchEditData({ notes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent resize-none"
                      rows={3}
                      placeholder="선택된 모든 거래에 추가될 메모를 입력하세요"
                    />
                  </div>
                )}

                {/* 프로젝트 연결 */}
                {batchEditMode === 'project' && (
                  <div>
                    <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
                      프로젝트 일괄 연결
                    </Typography>
                    <select
                      value={batchEditData.project_id || ''}
                      onChange={(e) => setBatchEditData({ project_id: e.target.value })}
                      className="w-full max-w-xs px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                    >
                      <option value="">프로젝트 선택...</option>
                      <option value="project-1">프로젝트 A</option>
                      <option value="project-2">프로젝트 B</option>
                      <option value="project-3">프로젝트 C</option>
                    </select>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBatchEdit}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      '처리 중...'
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        적용
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBatchEditMode(null);
                      setBatchEditData({});
                    }}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 선택된 항목 요약 */}
          <Card className="p-3 bg-white">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-txt-tertiary mt-0.5" />
              <div className="flex-1">
                <Typography variant="body2" className="text-txt-secondary text-xs">
                  선택된 거래들에 대한 작업은 즉시 적용되며, 되돌릴 수 없습니다.
                  신중하게 검토 후 진행해주세요.
                </Typography>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}