/**
 * 마이그레이션 훅
 * React 컴포넌트에서 마이그레이션 기능을 쉽게 사용할 수 있도록 제공
 */

import { useState, useCallback, useEffect } from 'react';
import { migrationService, MigrationStatus, MigrationOptions } from '@/lib/dashboard/migration/migration-service';
import { MigrationResult } from '@/lib/dashboard/migration/layout-migration';
import { DashboardLayout } from '@/types/dashboard';
import { useToast } from '@/hooks/useToast';

/**
 * 마이그레이션 훅 반환 타입
 */
export interface UseMigrationReturn {
  /** 마이그레이션 상태 */
  status: MigrationStatus;
  /** 마이그레이션 진행 중 여부 */
  isInProgress: boolean;
  /** 마이그레이션 진행률 (0-100) */
  progress: number;
  /** 마이그레이션 실행 */
  migrate: (layout: DashboardLayout, options?: MigrationOptions) => Promise<MigrationResult | null>;
  /** 마이그레이션 롤백 */
  rollback: (migrationId: string) => Promise<boolean>;
  /** 마이그레이션 가능 여부 확인 */
  canMigrate: (layout: DashboardLayout) => Promise<{ canMigrate: boolean; reason?: string }>;
  /** 마이그레이션 미리보기 */
  preview: (layout: DashboardLayout, options?: MigrationOptions) => Promise<any>;
  /** 마이그레이션 취소 */
  cancel: () => void;
  /** 마이그레이션 히스토리 */
  history: MigrationResult[];
  /** 히스토리 새로고침 */
  refreshHistory: () => void;
  /** 히스토리 초기화 */
  clearHistory: () => void;
}

/**
 * 마이그레이션 훅
 */
export function useMigration(): UseMigrationReturn {
  const { showToast } = useToast();
  const [status, setStatus] = useState<MigrationStatus>(() => 
    migrationService.getStatus()
  );
  const [history, setHistory] = useState<MigrationResult[]>([]);
  
  // 상태 업데이트 구독
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = migrationService.getStatus();
      setStatus(currentStatus);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // 히스토리 초기 로드
  useEffect(() => {
    setHistory(migrationService.getHistory());
  }, []);
  
  /**
   * 마이그레이션 실행
   */
  const migrate = useCallback(async (
    layout: DashboardLayout,
    options?: MigrationOptions
  ): Promise<MigrationResult | null> => {
    try {
      // 마이그레이션 가능 여부 확인
      const canMigrateResult = await migrationService.canMigrate(layout);
      if (!canMigrateResult.canMigrate) {
        showToast({
          title: '마이그레이션 불가',
          description: canMigrateResult.reason || '마이그레이션을 실행할 수 없습니다',
          variant: 'error',
        });
        return null;
      }
      
      // 경고가 있는 경우 표시
      if (canMigrateResult.recommendations?.length) {
        showToast({
          title: '마이그레이션 권장사항',
          description: canMigrateResult.recommendations.join('\n'),
          variant: 'warning',
        });
      }
      
      // 마이그레이션 시작 알림
      showToast({
        title: '마이그레이션 시작',
        description: '레이아웃을 iOS 스타일로 변환하고 있습니다...',
        variant: 'info',
      });
      
      // 마이그레이션 실행
      const result = await migrationService.migrate(layout, {
        ...options,
        onProgress: (progress) => {
          setStatus(progress);
        },
        onComplete: (result) => {
          // 성공 알림
          showToast({
            title: '마이그레이션 완료',
            description: `${result.metadata.migratedWidgetCount}개 위젯이 성공적으로 변환되었습니다`,
            variant: 'success',
          });
          
          // 히스토리 업데이트
          refreshHistory();
        },
        onError: (error) => {
          // 에러 알림
          showToast({
            title: '마이그레이션 실패',
            description: error.message,
            variant: 'error',
          });
        },
      });
      
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      showToast({
        title: '마이그레이션 오류',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: 'error',
      });
      return null;
    }
  }, [showToast]);
  
  /**
   * 마이그레이션 롤백
   */
  const rollback = useCallback(async (migrationId: string): Promise<boolean> => {
    try {
      showToast({
        title: '롤백 시작',
        description: '이전 상태로 복원하고 있습니다...',
        variant: 'info',
      });
      
      const success = await migrationService.rollback(migrationId);
      
      if (success) {
        showToast({
          title: '롤백 완료',
          description: '레이아웃이 이전 상태로 복원되었습니다',
          variant: 'success',
        });
      } else {
        showToast({
          title: '롤백 실패',
          description: '복원 중 오류가 발생했습니다',
          variant: 'error',
        });
      }
      
      refreshHistory();
      return success;
    } catch (error) {
      console.error('Rollback failed:', error);
      showToast({
        title: '롤백 오류',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: 'error',
      });
      return false;
    }
  }, [showToast]);
  
  /**
   * 마이그레이션 가능 여부 확인
   */
  const canMigrate = useCallback(async (layout: DashboardLayout) => {
    return await migrationService.canMigrate(layout);
  }, []);
  
  /**
   * 마이그레이션 미리보기
   */
  const preview = useCallback(async (
    layout: DashboardLayout,
    options?: MigrationOptions
  ) => {
    try {
      const result = await migrationService.preview(layout, options);
      
      // 경고가 있는 경우 표시
      if (result.warnings.length > 0) {
        showToast({
          title: '미리보기 경고',
          description: result.warnings.join('\n'),
          variant: 'warning',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Preview failed:', error);
      showToast({
        title: '미리보기 실패',
        description: error instanceof Error ? error.message : '미리보기를 생성할 수 없습니다',
        variant: 'error',
      });
      return null;
    }
  }, [showToast]);
  
  /**
   * 마이그레이션 취소
   */
  const cancel = useCallback(() => {
    migrationService.cancel();
    showToast({
      title: '마이그레이션 취소',
      description: '마이그레이션이 취소되었습니다',
      variant: 'info',
    });
  }, [showToast]);
  
  /**
   * 히스토리 새로고침
   */
  const refreshHistory = useCallback(() => {
    setHistory(migrationService.getHistory());
  }, []);
  
  /**
   * 히스토리 초기화
   */
  const clearHistory = useCallback(() => {
    migrationService.clearHistory();
    setHistory([]);
    showToast({
      title: '히스토리 초기화',
      description: '마이그레이션 히스토리가 초기화되었습니다',
      variant: 'info',
    });
  }, [showToast]);
  
  return {
    status,
    isInProgress: status.isInProgress,
    progress: status.progress,
    migrate,
    rollback,
    canMigrate,
    preview,
    cancel,
    history,
    refreshHistory,
    clearHistory,
  };
}