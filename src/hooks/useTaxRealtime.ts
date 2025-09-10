import { useEffect, useRef, useCallback } from 'react';
import useTaxStore from '@/lib/stores/taxStore';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

/**
 * 세무 데이터 실시간 구독 및 자동 갱신 훅
 */
export function useTaxRealtime() {
  const { 
    setTransactions, 
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setYearlyProjection,
    setMonthlyTrend,
    setMonthlyStatistics,
    filters 
  } = useTaxStore();

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<Date>(new Date());

  // 통계 데이터 새로고침 (디바운싱 적용)
  const refreshStatistics = useCallback(async () => {
    // 이전 타이머 취소
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // 500ms 디바운싱
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;

        // 병렬로 통계 데이터 갱신
        const [projection, trend, statistics] = await Promise.all([
          taxTransactionService.getYearlyProjection(year),
          taxTransactionService.getMonthlyTrend(year),
          taxTransactionService.getMonthlyStatistics(year, month)
        ]);

        setYearlyProjection(projection);
        setMonthlyTrend(trend);
        setMonthlyStatistics(statistics);

        lastUpdateRef.current = new Date();
      } catch (error) {
        console.error('Failed to refresh statistics:', error);
      }
    }, 500);
  }, [setYearlyProjection, setMonthlyTrend, setMonthlyStatistics]);

  // 거래 목록 새로고침
  const refreshTransactions = useCallback(async () => {
    try {
      const transactions = await taxTransactionService.getTransactions(filters);
      setTransactions(transactions);
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  }, [filters, setTransactions]);

  useEffect(() => {
    // Mock 데이터로 대체 - Supabase 실시간 구독 제거
    console.log('Using mock data - real-time subscription disabled');
    
    // 초기 데이터 로드
    refreshTransactions();
    refreshStatistics();

    // 정리 함수
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshStatistics, refreshTransactions]);

  // 수동 새로고침 함수 반환
  return {
    refreshStatistics,
    refreshTransactions,
    lastUpdate: lastUpdateRef.current
  };
}

/**
 * 세무 데이터 자동 동기화 훅
 * 페이지 포커스, 네트워크 재연결 시 자동으로 데이터 동기화
 */
export function useTaxAutoSync() {
  const { refreshStatistics, refreshTransactions } = useTaxRealtime();

  useEffect(() => {
    // 페이지 포커스 시 데이터 새로고침
    const handleFocus = () => {
      console.log('Page focused, syncing tax data...');
      refreshTransactions();
      refreshStatistics();
    };

    // 네트워크 재연결 시 데이터 새로고침
    const handleOnline = () => {
      console.log('Network reconnected, syncing tax data...');
      refreshTransactions();
      refreshStatistics();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshStatistics, refreshTransactions]);

  // 5분마다 자동 동기화 (선택적)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-syncing tax data...');
      refreshStatistics();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [refreshStatistics]);
}