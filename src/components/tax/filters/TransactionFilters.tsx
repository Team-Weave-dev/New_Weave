'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Filter, 
  Calendar, 
  DollarSign,
  Building2,
  FileText,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import useTaxStore from '@/lib/stores/taxStore';

interface TransactionFiltersProps {
  onApply?: (filters: FilterState) => void;
  onReset?: () => void;
  collapsed?: boolean;
}

export interface FilterState {
  transaction_type?: 'all' | 'sales' | 'purchase';
  payment_status?: 'all' | 'pending' | 'paid' | 'overdue';
  date_range?: {
    start?: string;
    end?: string;
  };
  amount_range?: {
    min?: number;
    max?: number;
  };
  supplier_name?: string;
}

export default function TransactionFilters({ 
  onApply, 
  onReset,
  collapsed = false 
}: TransactionFiltersProps) {
  const { filters, setFilters, clearFilters } = useTaxStore();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [localFilters, setLocalFilters] = useState<FilterState>({
    transaction_type: 'all',
    payment_status: 'all',
    date_range: {},
    amount_range: {},
    supplier_name: ''
  });

  // 필터 적용
  const handleApply = () => {
    const appliedFilters: any = {};
    
    if (localFilters.transaction_type && localFilters.transaction_type !== 'all') {
      appliedFilters.transaction_type = localFilters.transaction_type;
    }
    
    if (localFilters.payment_status && localFilters.payment_status !== 'all') {
      appliedFilters.payment_status = localFilters.payment_status;
    }
    
    if (localFilters.date_range?.start) {
      appliedFilters.start_date = localFilters.date_range.start;
    }
    
    if (localFilters.date_range?.end) {
      appliedFilters.end_date = localFilters.date_range.end;
    }
    
    if (localFilters.amount_range?.min !== undefined) {
      appliedFilters.min_amount = localFilters.amount_range.min;
    }
    
    if (localFilters.amount_range?.max !== undefined) {
      appliedFilters.max_amount = localFilters.amount_range.max;
    }
    
    if (localFilters.supplier_name) {
      appliedFilters.supplier_name = localFilters.supplier_name;
    }

    setFilters(appliedFilters);
    onApply?.(localFilters);
  };

  // 필터 초기화
  const handleReset = () => {
    const resetFilters: FilterState = {
      transaction_type: 'all',
      payment_status: 'all',
      date_range: {},
      amount_range: {},
      supplier_name: ''
    };
    
    setLocalFilters(resetFilters);
    clearFilters();
    onReset?.();
  };

  // 활성 필터 개수 계산
  const activeFilterCount = () => {
    let count = 0;
    if (localFilters.transaction_type && localFilters.transaction_type !== 'all') count++;
    if (localFilters.payment_status && localFilters.payment_status !== 'all') count++;
    if (localFilters.date_range?.start || localFilters.date_range?.end) count++;
    if (localFilters.amount_range?.min !== undefined || localFilters.amount_range?.max !== undefined) count++;
    if (localFilters.supplier_name) count++;
    return count;
  };

  return (
    <Card className="overflow-hidden">
      {/* 헤더 */}
      <div 
        className="px-4 py-3 bg-bg-secondary border-b border-border-light flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-txt-secondary" />
          <Typography variant="h3" className="text-base font-semibold text-txt-primary">
            필터
          </Typography>
          {activeFilterCount() > 0 && (
            <span className="px-2 py-0.5 bg-weave-primary text-white text-xs rounded-full">
              {activeFilterCount()}
            </span>
          )}
        </div>
        <button className="p-1 hover:bg-bg-tertiary rounded transition-colors">
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-txt-secondary" />
          ) : (
            <ChevronUp className="w-5 h-5 text-txt-secondary" />
          )}
        </button>
      </div>

      {/* 필터 본체 */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* 거래 구분 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              거래 구분
            </Typography>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, transaction_type: 'all' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.transaction_type === 'all'
                    ? 'bg-weave-primary text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, transaction_type: 'sales' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.transaction_type === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                매출
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, transaction_type: 'purchase' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.transaction_type === 'purchase'
                    ? 'bg-red-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                매입
              </button>
            </div>
          </div>

          {/* 결제 상태 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              결제 상태
            </Typography>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalFilters({ ...localFilters, payment_status: 'all' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.payment_status === 'all'
                    ? 'bg-weave-primary text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, payment_status: 'pending' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.payment_status === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                대기
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, payment_status: 'paid' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.payment_status === 'paid'
                    ? 'bg-green-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                완료
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, payment_status: 'overdue' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.payment_status === 'overdue'
                    ? 'bg-red-600 text-white'
                    : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
                }`}
              >
                연체
              </button>
            </div>
          </div>

          {/* 기간 선택 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              기간 선택
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="date"
                  value={localFilters.date_range?.start || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    date_range: {
                      ...localFilters.date_range,
                      start: e.target.value
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="시작일"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="date"
                  value={localFilters.date_range?.end || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    date_range: {
                      ...localFilters.date_range,
                      end: e.target.value
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="종료일"
                />
              </div>
            </div>
            {/* 빠른 선택 버튼 */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  setLocalFilters({
                    ...localFilters,
                    date_range: {
                      start: format(startOfMonth, 'yyyy-MM-dd'),
                      end: format(endOfMonth, 'yyyy-MM-dd')
                    }
                  });
                }}
                className="px-2 py-1 text-xs bg-bg-secondary text-txt-secondary rounded hover:bg-bg-tertiary transition-colors"
              >
                이번 달
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  setLocalFilters({
                    ...localFilters,
                    date_range: {
                      start: format(lastMonth, 'yyyy-MM-dd'),
                      end: format(endOfLastMonth, 'yyyy-MM-dd')
                    }
                  });
                }}
                className="px-2 py-1 text-xs bg-bg-secondary text-txt-secondary rounded hover:bg-bg-tertiary transition-colors"
              >
                지난 달
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                  const endOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
                  setLocalFilters({
                    ...localFilters,
                    date_range: {
                      start: format(startOfQuarter, 'yyyy-MM-dd'),
                      end: format(endOfQuarter, 'yyyy-MM-dd')
                    }
                  });
                }}
                className="px-2 py-1 text-xs bg-bg-secondary text-txt-secondary rounded hover:bg-bg-tertiary transition-colors"
              >
                이번 분기
              </button>
            </div>
          </div>

          {/* 금액 범위 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              금액 범위
            </Typography>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="number"
                  value={localFilters.amount_range?.min || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    amount_range: {
                      ...localFilters.amount_range,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="최소 금액"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="number"
                  value={localFilters.amount_range?.max || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    amount_range: {
                      ...localFilters.amount_range,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                  placeholder="최대 금액"
                />
              </div>
            </div>
          </div>

          {/* 거래처 검색 */}
          <div>
            <Typography variant="body2" className="text-txt-secondary mb-2 text-sm font-medium">
              거래처 검색
            </Typography>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
              <input
                type="text"
                value={localFilters.supplier_name || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  supplier_name: e.target.value
                })}
                className="w-full pl-10 pr-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary focus:border-transparent"
                placeholder="거래처명 검색"
              />
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              <Filter className="w-4 h-4 mr-2" />
              필터 적용
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              초기화
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}