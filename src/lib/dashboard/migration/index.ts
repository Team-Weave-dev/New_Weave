/**
 * 마이그레이션 모듈 인덱스
 * 레이아웃 마이그레이션 관련 모든 기능 export
 */

// 레이아웃 마이그레이션 코어
export {
  layoutMigration,
  LayoutMigration,
  type MigrationResult,
} from './layout-migration';

// 마이그레이션 서비스
export {
  migrationService,
  MigrationService,
  type MigrationStatus,
  type MigrationOptions,
} from './migration-service';

// GridSize to Columns 매핑 유틸리티
export const gridSizeToColumns = (gridSize: string): number => {
  const mapping: Record<string, number> = {
    '2x2': 2,
    '3x3': 4,
    '4x4': 4,
    '5x5': 6,
  };
  return mapping[gridSize] || 4;
};

// Columns to GridSize 역매핑 유틸리티
export const columnsToGridSize = (columns: number): string => {
  if (columns <= 2) return '2x2';
  if (columns <= 4) return '4x4';
  if (columns <= 6) return '5x5';
  return '4x4'; // 기본값
};

/**
 * 마이그레이션 진행률 계산 유틸리티
 */
export const calculateMigrationProgress = (
  current: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * 마이그레이션 시간 추정 유틸리티
 */
export const estimateMigrationTime = (
  widgetCount: number,
  perWidgetMs: number = 50
): number => {
  // 기본 설정 시간 + 위젯당 처리 시간
  const baseTime = 500; // 0.5초
  return baseTime + (widgetCount * perWidgetMs);
};

/**
 * 마이그레이션 통계 계산
 */
export interface MigrationStats {
  totalWidgets: number;
  successfulWidgets: number;
  failedWidgets: number;
  successRate: number;
  estimatedTime: number;
  actualTime?: number;
}

export const calculateMigrationStats = (
  result: any,
  startTime?: Date,
  endTime?: Date
): MigrationStats => {
  const totalWidgets = result.metadata?.originalWidgetCount || 0;
  const successfulWidgets = result.metadata?.migratedWidgetCount || 0;
  const failedWidgets = result.error?.failedWidgets?.length || 0;
  
  const successRate = totalWidgets > 0 
    ? Math.round((successfulWidgets / totalWidgets) * 100)
    : 0;
  
  const estimatedTime = estimateMigrationTime(totalWidgets);
  const actualTime = startTime && endTime 
    ? endTime.getTime() - startTime.getTime()
    : undefined;
  
  return {
    totalWidgets,
    successfulWidgets,
    failedWidgets,
    successRate,
    estimatedTime,
    actualTime,
  };
};

/**
 * 마이그레이션 권장사항 생성
 */
export interface MigrationRecommendation {
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: string;
}

export const generateMigrationRecommendations = (
  layout: any
): MigrationRecommendation[] => {
  const recommendations: MigrationRecommendation[] = [];
  
  // 위젯 수 체크
  if (layout.widgets?.length > 20) {
    recommendations.push({
      type: 'warning',
      message: '많은 수의 위젯이 있습니다',
      action: '점진적 마이그레이션을 사용하는 것을 권장합니다',
    });
  }
  
  // 그리드 크기 체크
  if (layout.gridSize === '2x2') {
    recommendations.push({
      type: 'info',
      message: '작은 그리드 크기를 사용 중입니다',
      action: '마이그레이션 후 더 큰 화면에서 레이아웃을 확인하세요',
    });
  }
  
  // 잠긴 위젯 체크
  const lockedWidgets = layout.widgets?.filter((w: any) => w.locked) || [];
  if (lockedWidgets.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${lockedWidgets.length}개의 잠긴 위젯이 있습니다`,
      action: '잠긴 위젯은 위치가 보존됩니다',
    });
  }
  
  return recommendations;
};

/**
 * 마이그레이션 체크리스트
 */
export interface MigrationChecklist {
  item: string;
  checked: boolean;
  required: boolean;
}

export const getMigrationChecklist = (): MigrationChecklist[] => {
  return [
    {
      item: '현재 레이아웃 백업',
      checked: false,
      required: true,
    },
    {
      item: '위젯 위치 확인',
      checked: false,
      required: true,
    },
    {
      item: '사용자 정의 설정 검토',
      checked: false,
      required: false,
    },
    {
      item: '테스트 환경에서 미리보기',
      checked: false,
      required: false,
    },
    {
      item: '팀원에게 변경 알림',
      checked: false,
      required: false,
    },
  ];
};

/**
 * 마이그레이션 성공 메시지 생성
 */
export const getMigrationSuccessMessage = (stats: MigrationStats): string => {
  if (stats.successRate === 100) {
    return `완벽합니다! ${stats.totalWidgets}개 위젯이 모두 성공적으로 변환되었습니다.`;
  } else if (stats.successRate >= 80) {
    return `대부분 성공! ${stats.successfulWidgets}/${stats.totalWidgets}개 위젯이 변환되었습니다.`;
  } else if (stats.successRate >= 50) {
    return `부분 성공. ${stats.successfulWidgets}/${stats.totalWidgets}개 위젯이 변환되었습니다.`;
  } else {
    return `마이그레이션에 문제가 있었습니다. ${stats.failedWidgets}개 위젯 변환에 실패했습니다.`;
  }
};

/**
 * 마이그레이션 리스크 레벨 계산
 */
export type MigrationRiskLevel = 'low' | 'medium' | 'high';

export const calculateMigrationRisk = (
  layout: any
): MigrationRiskLevel => {
  let riskScore = 0;
  
  // 위젯 수에 따른 리스크
  if (layout.widgets?.length > 30) riskScore += 3;
  else if (layout.widgets?.length > 15) riskScore += 1;
  
  // 복잡한 레이아웃
  const hasComplexWidgets = layout.widgets?.some(
    (w: any) => w.config?.complex || w.position?.width > 3 || w.position?.height > 3
  );
  if (hasComplexWidgets) riskScore += 2;
  
  // 사용자 정의 설정
  const hasCustomSettings = layout.widgets?.some(
    (w: any) => w.config && Object.keys(w.config).length > 5
  );
  if (hasCustomSettings) riskScore += 1;
  
  // 리스크 레벨 결정
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
};

/**
 * 마이그레이션 설정 프리셋
 */
export const MIGRATION_PRESETS = {
  safe: {
    preservePositions: true,
    validateLayout: true,
    autoFix: false,
    createBackup: true,
    dryRun: false,
    progressive: false,
  },
  fast: {
    preservePositions: false,
    validateLayout: false,
    autoFix: true,
    createBackup: false,
    dryRun: false,
    progressive: false,
  },
  progressive: {
    preservePositions: true,
    validateLayout: true,
    autoFix: true,
    createBackup: true,
    dryRun: false,
    progressive: true,
  },
  test: {
    preservePositions: true,
    validateLayout: true,
    autoFix: true,
    createBackup: true,
    dryRun: true,
    progressive: false,
  },
};

// 기본 export
export default {
  layoutMigration,
  migrationService,
  gridSizeToColumns,
  columnsToGridSize,
  calculateMigrationProgress,
  estimateMigrationTime,
  calculateMigrationStats,
  generateMigrationRecommendations,
  getMigrationChecklist,
  getMigrationSuccessMessage,
  calculateMigrationRisk,
  MIGRATION_PRESETS,
};