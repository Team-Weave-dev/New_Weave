'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Edit2, 
  Trash2, 
  ChevronRight,
  Calendar,
  Building2,
  Receipt,
  Check,
  X
} from 'lucide-react';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';
import { formatFullCurrency, formatKoreanDate, getTransactionTypeColor, getPaymentStatusColor } from '@/lib/utils/tax-formatters';
import useTaxStore from '@/lib/stores/taxStore';

interface TransactionCardsProps {
  transactions: Transaction[];
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface SwipeableCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function SwipeableCard({ 
  transaction, 
  onEdit, 
  onDelete,
  isSelected,
  onSelect
}: SwipeableCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const typeColor = getTransactionTypeColor(transaction.transaction_type);
  const statusColor = getPaymentStatusColor(transaction.payment_status || 'pending');

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // 최대 스와이프 거리 제한
    const maxSwipe = 120;
    const minSwipe = -120;
    
    if (diff > maxSwipe) {
      setSwipeX(maxSwipe);
    } else if (diff < minSwipe) {
      setSwipeX(minSwipe);
    } else {
      setSwipeX(diff);
    }
  };

  // 터치 종료
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // 스와이프 임계값
    const threshold = 60;
    
    if (swipeX > threshold) {
      // 오른쪽 스와이프 - 편집
      // 애니메이션 후 액션 실행
      setSwipeX(120);
      setTimeout(() => {
        onEdit?.(transaction);
        setSwipeX(0);
      }, 200);
    } else if (swipeX < -threshold) {
      // 왼쪽 스와이프 - 삭제
      setSwipeX(-120);
      setTimeout(() => {
        if (confirm('이 거래를 삭제하시겠습니까?')) {
          onDelete?.(transaction.id);
        }
        setSwipeX(0);
      }, 200);
    } else {
      // 원위치로 복귀
      setSwipeX(0);
    }
  };

  // 마우스 이벤트 (데스크톱 테스트용)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startX;
    const maxSwipe = 120;
    const minSwipe = -120;
    
    if (diff > maxSwipe) {
      setSwipeX(maxSwipe);
    } else if (diff < minSwipe) {
      setSwipeX(minSwipe);
    } else {
      setSwipeX(diff);
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* 스와이프 액션 배경 */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className={`flex items-center gap-2 text-blue-600 transition-opacity duration-200 ${
          swipeX > 30 ? 'opacity-100' : 'opacity-0'
        }`}>
          <Edit2 className="w-5 h-5" />
          <span className="text-sm font-medium">편집</span>
        </div>
        <div className={`flex items-center gap-2 text-red-600 transition-opacity duration-200 ${
          swipeX < -30 ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="text-sm font-medium">삭제</span>
          <Trash2 className="w-5 h-5" />
        </div>
      </div>

      {/* 카드 본체 */}
      <div
        ref={cardRef}
        className={`relative bg-white transition-all ${isDragging ? '' : 'duration-300 ease-out'} ${
          Math.abs(swipeX) > 60 ? 'shadow-lg' : 'shadow-sm'
        }`}
        style={{ 
          transform: `translateX(${swipeX}px) rotate(${swipeX * 0.02}deg)`,
          opacity: Math.abs(swipeX) > 100 ? 0.9 : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Card className={`p-4 ${isSelected ? 'ring-2 ring-weave-primary' : ''}`}>
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 text-weave-primary bg-white border-gray-300 rounded focus:ring-weave-primary"
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor.bg} ${typeColor.text}`}>
                  {transaction.transaction_type}
                </span>
              </div>
            </div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
              {statusColor.label}
            </span>
          </div>

          {/* 거래처 정보 */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-txt-tertiary" />
              <Typography variant="body1" className="font-semibold text-txt-primary">
                {transaction.supplier_name}
              </Typography>
            </div>
            {transaction.supplier_business_number && (
              <Typography variant="body2" className="text-txt-tertiary text-xs ml-6">
                사업자번호: {transaction.supplier_business_number}
              </Typography>
            )}
          </div>

          {/* 금액 정보 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Typography variant="body2" className="text-txt-tertiary text-xs mb-1">
                공급가액
              </Typography>
              <Typography variant="body1" className="font-medium text-txt-primary">
                {formatFullCurrency(Number(transaction.supply_amount))}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-txt-tertiary text-xs mb-1">
                부가세
              </Typography>
              <Typography variant="body1" className="font-medium text-txt-primary">
                {formatFullCurrency(Number(transaction.vat_amount))}
              </Typography>
            </div>
          </div>

          {/* 합계 */}
          <div className="p-3 bg-bg-secondary rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-txt-secondary">
                합계
              </Typography>
              <Typography variant="h3" className="text-lg font-bold text-txt-primary">
                {formatFullCurrency(Number(transaction.total_amount))}
              </Typography>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-txt-tertiary">
              <Calendar className="w-3 h-3" />
              <span>{formatKoreanDate(transaction.transaction_date)}</span>
            </div>
            {transaction.invoice_number && (
              <div className="flex items-center gap-1 text-txt-tertiary">
                <Receipt className="w-3 h-3" />
                <span>{transaction.invoice_number}</span>
              </div>
            )}
          </div>

          {/* 메모 */}
          {transaction.notes && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <Typography variant="body2" className="text-txt-tertiary text-xs">
                {transaction.notes}
              </Typography>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function TransactionCards({
  transactions,
  loading = false,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false
}: TransactionCardsProps) {
  const { 
    selectedTransactions,
    selectTransaction,
    deselectTransaction,
    clearSelection 
  } = useTaxStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤 설정
  useEffect(() => {
    if (loading || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, onLoadMore]);

  const toggleSelection = (id: string) => {
    if (selectedTransactions.includes(id)) {
      deselectTransaction(id);
    } else {
      selectTransaction(id);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-bg-secondary rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 선택된 항목 액션 바 */}
      {selectedTransactions.length > 0 && (
        <Card className="p-3 bg-blue-50 border-blue-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Typography variant="body2" className="text-blue-700">
              {selectedTransactions.length}개 선택됨
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                해제
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
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 거래 카드 목록 */}
      {transactions.map((transaction) => (
        <SwipeableCard
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelected={selectedTransactions.includes(transaction.id)}
          onSelect={() => toggleSelection(transaction.id)}
        />
      ))}

      {/* 빈 상태 */}
      {transactions.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Typography variant="body1" className="text-txt-tertiary mb-2">
            거래 내역이 없습니다
          </Typography>
          <Typography variant="body2" className="text-txt-tertiary">
            새로운 거래를 추가해보세요
          </Typography>
        </Card>
      )}

      {/* 로드 모어 트리거 */}
      {hasMore && (
        <div ref={loadMoreRef} className="p-4 text-center">
          {loading ? (
            <Typography variant="body2" className="text-txt-tertiary">
              로딩 중...
            </Typography>
          ) : (
            <Button variant="outline" size="sm" onClick={onLoadMore}>
              더 보기
            </Button>
          )}
        </div>
      )}

      {/* 스와이프 안내 */}
      {transactions.length > 0 && transactions.length <= 3 && (
        <Card className="p-3 bg-bg-secondary">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-txt-tertiary" />
            <Typography variant="body2" className="text-txt-tertiary text-xs">
              카드를 좌우로 스와이프하여 편집하거나 삭제할 수 있습니다
            </Typography>
          </div>
        </Card>
      )}
    </div>
  );
}