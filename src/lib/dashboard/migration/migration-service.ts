/**
 * 마이그레이션 서비스
 * 대시보드 스토어와 연동하여 실제 마이그레이션 수행
 */

import { layoutMigration, MigrationResult } from './layout-migration';
import { DashboardLayout } from '@/types/dashboard';
import { IOSStyleWidget } from '@/types/ios-dashboard';

/**
 * 마이그레이션 상태 타입
 */
export interface MigrationStatus {
  /** 마이그레이션 진행 중 */
  isInProgress: boolean;
  /** 현재 진행률 (0-100) */
  progress: number;
  /** 현재 단계 */
  currentStep: string;
  /** 전체 단계 수 */
  totalSteps: number;
  /** 에러 메시지 */
  error?: string;
  /** 마이그레이션 시작 시간 */
  startedAt?: Date;
  /** 마이그레이션 완료 시간 */
  completedAt?: Date;
}

/**
 * 마이그레이션 옵션
 */
export interface MigrationOptions {
  /** 기존 위치 보존 여부 */
  preservePositions?: boolean;
  /** 레이아웃 유효성 검사 */
  validateLayout?: boolean;
  /** 자동 수정 활성화 */
  autoFix?: boolean;
  /** 백업 생성 */
  createBackup?: boolean;
  /** 드라이런 (실제 적용하지 않고 테스트) */
  dryRun?: boolean;
  /** 프로그레시브 마이그레이션 (점진적 적용) */
  progressive?: boolean;
  /** 콜백 함수 */
  onProgress?: (status: MigrationStatus) => void;
  onComplete?: (result: MigrationResult) => void;
  onError?: (error: Error) => void;
}

/**
 * 마이그레이션 서비스 클래스
 */
export class MigrationService {
  private static instance: MigrationService;
  private currentStatus: MigrationStatus = {
    isInProgress: false,
    progress: 0,
    currentStep: '',
    totalSteps: 0,
  };
  
  private constructor() {}
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }
  
  /**
   * 현재 마이그레이션 상태 조회
   */
  getStatus(): MigrationStatus {
    return { ...this.currentStatus };
  }
  
  /**
   * 대시보드 레이아웃 마이그레이션 실행
   */
  async migrate(
    layout: DashboardLayout,
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const {
      preservePositions = true,
      validateLayout = true,
      autoFix = true,
      createBackup = true,
      dryRun = false,
      progressive = false,
      onProgress,
      onComplete,
      onError,
    } = options;
    
    // 이미 진행 중인 마이그레이션이 있는지 확인
    if (this.currentStatus.isInProgress) {
      const error = new Error('Migration already in progress');
      onError?.(error);
      throw error;
    }
    
    try {
      // 마이그레이션 시작
      this.updateStatus({
        isInProgress: true,
        progress: 0,
        currentStep: '마이그레이션 준비',
        totalSteps: 5,
        startedAt: new Date(),
      });
      onProgress?.(this.currentStatus);
      
      // Step 1: 레이아웃 분석
      this.updateStatus({
        progress: 20,
        currentStep: '레이아웃 분석',
      });
      onProgress?.(this.currentStatus);
      await this.delay(100);
      
      // Step 2: 백업 생성
      if (createBackup) {
        this.updateStatus({
          progress: 40,
          currentStep: '백업 생성',
        });
        onProgress?.(this.currentStatus);
        await this.delay(100);
      }
      
      // Step 3: 마이그레이션 실행
      this.updateStatus({
        progress: 60,
        currentStep: '위젯 변환',
      });
      onProgress?.(this.currentStatus);
      
      const result = await layoutMigration.migrateLayout(layout, {
        preservePositions,
        validateLayout,
        autoFix,
      });
      
      // Step 4: 유효성 검사
      this.updateStatus({
        progress: 80,
        currentStep: '유효성 검사',
      });
      onProgress?.(this.currentStatus);
      await this.delay(100);
      
      // Dry run 모드에서는 실제 적용하지 않음
      if (dryRun) {
        console.log('Dry run completed. No changes applied.');
        this.updateStatus({
          progress: 100,
          currentStep: '드라이런 완료',
          isInProgress: false,
          completedAt: new Date(),
        });
        onProgress?.(this.currentStatus);
        onComplete?.(result);
        return result;
      }
      
      // Step 5: 변경사항 적용
      if (progressive) {
        await this.applyProgressive(result, onProgress);
      } else {
        this.updateStatus({
          progress: 90,
          currentStep: '변경사항 적용',
        });
        onProgress?.(this.currentStatus);
        await this.applyMigration(result);
      }
      
      // 완료
      this.updateStatus({
        isInProgress: false,
        progress: 100,
        currentStep: '마이그레이션 완료',
        completedAt: new Date(),
      });
      onProgress?.(this.currentStatus);
      onComplete?.(result);
      
      return result;
      
    } catch (error) {
      // 에러 처리
      this.updateStatus({
        isInProgress: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
      onError?.(error as Error);
      throw error;
    }
  }
  
  /**
   * 마이그레이션 적용
   */
  private async applyMigration(result: MigrationResult): Promise<void> {
    // 실제로는 여기서 대시보드 스토어를 업데이트해야 함
    // 예: useDashboardStore.getState().setWidgets(result.widgets)
    console.log('Applying migration:', result.metadata);
    await this.delay(200);
  }
  
  /**
   * 점진적 마이그레이션 적용
   */
  private async applyProgressive(
    result: MigrationResult,
    onProgress?: (status: MigrationStatus) => void
  ): Promise<void> {
    const { widgets } = result;
    const batchSize = Math.ceil(widgets.length / 4); // 4개 배치로 나누기
    
    for (let i = 0; i < widgets.length; i += batchSize) {
      const batch = widgets.slice(i, i + batchSize);
      const progress = 90 + (10 * (i + batchSize) / widgets.length);
      
      this.updateStatus({
        progress: Math.min(progress, 100),
        currentStep: `위젯 적용 (${i + batch.length}/${widgets.length})`,
      });
      onProgress?.(this.currentStatus);
      
      // 배치 적용
      console.log(`Applying batch: ${i / batchSize + 1}`);
      await this.delay(100);
    }
  }
  
  /**
   * 마이그레이션 롤백
   */
  async rollback(migrationId: string): Promise<boolean> {
    try {
      this.updateStatus({
        isInProgress: true,
        progress: 0,
        currentStep: '롤백 시작',
        totalSteps: 3,
        startedAt: new Date(),
      });
      
      // 롤백 실행
      const success = await layoutMigration.rollback(migrationId);
      
      this.updateStatus({
        isInProgress: false,
        progress: 100,
        currentStep: success ? '롤백 완료' : '롤백 실패',
        completedAt: new Date(),
      });
      
      return success;
    } catch (error) {
      this.updateStatus({
        isInProgress: false,
        error: error instanceof Error ? error.message : 'Rollback failed',
        completedAt: new Date(),
      });
      return false;
    }
  }
  
  /**
   * 마이그레이션 가능 여부 확인
   */
  async canMigrate(layout: DashboardLayout): Promise<{
    canMigrate: boolean;
    reason?: string;
    recommendations?: string[];
  }> {
    // 기본 검증
    if (!layout.widgets || layout.widgets.length === 0) {
      return {
        canMigrate: false,
        reason: '변환할 위젯이 없습니다',
      };
    }
    
    // 지원되는 그리드 크기 확인
    const supportedSizes = ['2x2', '3x3', '4x4', '5x5'];
    if (!supportedSizes.includes(layout.gridSize)) {
      return {
        canMigrate: false,
        reason: `지원되지 않는 그리드 크기: ${layout.gridSize}`,
        recommendations: ['지원되는 그리드 크기로 변경하세요'],
      };
    }
    
    // 위젯 검증
    const invalidWidgets = layout.widgets.filter(
      widget => !widget.position || !widget.type
    );
    
    if (invalidWidgets.length > 0) {
      return {
        canMigrate: true,
        reason: `${invalidWidgets.length}개의 위젯에 문제가 있습니다`,
        recommendations: ['자동 수정 옵션을 활성화하세요'],
      };
    }
    
    return {
      canMigrate: true,
    };
  }
  
  /**
   * 마이그레이션 예상 결과 미리보기
   */
  async preview(
    layout: DashboardLayout,
    options?: MigrationOptions
  ): Promise<{
    preview: IOSStyleWidget[];
    changes: string[];
    warnings: string[];
  }> {
    // Dry run으로 미리보기 생성
    const result = await this.migrate(layout, {
      ...options,
      dryRun: true,
    });
    
    // 변경사항 분석
    const changes: string[] = [];
    const warnings: string[] = [];
    
    // 그리드 크기 변경
    changes.push(
      `그리드 크기: ${layout.gridSize} → ${result.gridConfig.columns}컬럼`
    );
    
    // 위젯 수 변경
    if (result.metadata.originalWidgetCount !== result.metadata.migratedWidgetCount) {
      warnings.push(
        `위젯 수 변경: ${result.metadata.originalWidgetCount} → ${result.metadata.migratedWidgetCount}`
      );
    }
    
    // 실패한 위젯
    if (result.error?.failedWidgets.length) {
      warnings.push(
        `${result.error.failedWidgets.length}개 위젯 변환 실패`
      );
    }
    
    return {
      preview: result.widgets,
      changes,
      warnings,
    };
  }
  
  /**
   * 상태 업데이트
   */
  private updateStatus(updates: Partial<MigrationStatus>): void {
    this.currentStatus = {
      ...this.currentStatus,
      ...updates,
    };
  }
  
  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 마이그레이션 취소
   */
  cancel(): void {
    if (this.currentStatus.isInProgress) {
      this.updateStatus({
        isInProgress: false,
        error: 'Migration cancelled by user',
        completedAt: new Date(),
      });
    }
  }
  
  /**
   * 마이그레이션 히스토리 조회
   */
  getHistory(): MigrationResult[] {
    return layoutMigration.getHistory();
  }
  
  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    layoutMigration.clearHistory();
  }
}

// 싱글톤 인스턴스 export
export const migrationService = MigrationService.getInstance();