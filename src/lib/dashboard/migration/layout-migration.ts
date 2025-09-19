/**
 * 레이아웃 마이그레이션 시스템
 * 기존 그리드 시스템에서 iOS 스타일 유연한 그리드 시스템으로 변환
 */

import { 
  GridSize, 
  Widget, 
  DashboardLayout,
  WidgetPosition 
} from '@/types/dashboard';
import { 
  IOSStyleWidget,
  FlexibleWidgetPosition,
  GridConfig,
  WidgetState,
  LayoutSnapshot,
  mapLegacyToFlexible
} from '@/types/ios-dashboard';

/**
 * 그리드 크기를 컬럼 수로 변환하는 맵핑
 */
const GRID_SIZE_TO_COLUMNS: Record<GridSize, number> = {
  '2x2': 2,
  '3x3': 4, // 3x3은 4컬럼으로 매핑 (더 유연한 레이아웃을 위해)
  '4x4': 4,
  '5x5': 6, // 5x5는 6컬럼으로 매핑 (더 나은 반응형을 위해)
};

/**
 * 기본 그리드 설정
 */
const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 4,
  rowHeight: 120,
  gap: 16,
  padding: 20,
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },
};

/**
 * 마이그레이션 결과 타입
 */
export interface MigrationResult {
  /** 마이그레이션 성공 여부 */
  success: boolean;
  /** 변환된 iOS 스타일 위젯 배열 */
  widgets: IOSStyleWidget[];
  /** 그리드 설정 */
  gridConfig: GridConfig;
  /** 마이그레이션 메타데이터 */
  metadata: {
    originalGridSize: GridSize;
    originalWidgetCount: number;
    migratedWidgetCount: number;
    timestamp: Date;
    version: string;
  };
  /** 에러 정보 (실패 시) */
  error?: {
    message: string;
    failedWidgets: string[];
  };
  /** 백업 스냅샷 (롤백용) */
  backup: LayoutSnapshot;
}

/**
 * 레이아웃 마이그레이션 클래스
 */
export class LayoutMigration {
  private static instance: LayoutMigration;
  private migrationHistory: MigrationResult[] = [];
  
  private constructor() {}
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): LayoutMigration {
    if (!LayoutMigration.instance) {
      LayoutMigration.instance = new LayoutMigration();
    }
    return LayoutMigration.instance;
  }
  
  /**
   * 대시보드 레이아웃을 iOS 스타일로 마이그레이션
   */
  async migrateLayout(
    layout: DashboardLayout,
    options?: {
      preservePositions?: boolean;
      validateLayout?: boolean;
      autoFix?: boolean;
    }
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const { preservePositions = true, validateLayout = true, autoFix = true } = options || {};
    
    try {
      // 백업 생성
      const backup = this.createBackupSnapshot(layout);
      
      // 그리드 설정 결정
      const gridConfig = this.determineGridConfig(layout.gridSize);
      
      // 위젯 변환
      const migratedWidgets: IOSStyleWidget[] = [];
      const failedWidgets: string[] = [];
      
      for (const widget of layout.widgets) {
        try {
          const migratedWidget = await this.migrateWidget(
            widget, 
            gridConfig,
            preservePositions
          );
          
          // 유효성 검사
          if (validateLayout && !this.validateWidgetPosition(migratedWidget, gridConfig)) {
            if (autoFix) {
              const fixedWidget = this.autoFixPosition(migratedWidget, gridConfig);
              migratedWidgets.push(fixedWidget);
            } else {
              failedWidgets.push(widget.id);
            }
          } else {
            migratedWidgets.push(migratedWidget);
          }
        } catch (error) {
          console.error(`Failed to migrate widget ${widget.id}:`, error);
          failedWidgets.push(widget.id);
        }
      }
      
      // 충돌 해결
      if (autoFix) {
        this.resolveCollisions(migratedWidgets, gridConfig);
      }
      
      // 결과 생성
      const result: MigrationResult = {
        success: failedWidgets.length === 0,
        widgets: migratedWidgets,
        gridConfig,
        metadata: {
          originalGridSize: layout.gridSize,
          originalWidgetCount: layout.widgets.length,
          migratedWidgetCount: migratedWidgets.length,
          timestamp: new Date(),
          version: '1.0.0',
        },
        backup,
      };
      
      if (failedWidgets.length > 0) {
        result.error = {
          message: `Failed to migrate ${failedWidgets.length} widgets`,
          failedWidgets,
        };
      }
      
      // 히스토리에 추가
      this.migrationHistory.push(result);
      
      console.log(`Migration completed in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Layout migration failed: ${error}`);
    }
  }
  
  /**
   * 개별 위젯 마이그레이션
   */
  private async migrateWidget(
    widget: Widget,
    gridConfig: GridConfig,
    preservePositions: boolean
  ): Promise<IOSStyleWidget> {
    // 위치 변환
    const position = preservePositions 
      ? this.convertPosition(widget.position, gridConfig)
      : this.calculateOptimalPosition(widget, gridConfig);
    
    // 기본 상태 생성
    const state: WidgetState = {
      isLocked: widget.locked || false,
      isHidden: false,
      isLoading: false,
      hasError: false,
      lastUpdated: new Date(),
    };
    
    // iOS 스타일 위젯 생성
    const iosWidget: IOSStyleWidget = {
      id: widget.id,
      type: widget.type,
      position,
      state,
      config: widget.config,
      locked: widget.locked,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
      },
    };
    
    return iosWidget;
  }
  
  /**
   * 기존 위치를 유연한 위치로 변환
   */
  private convertPosition(
    position: WidgetPosition,
    gridConfig: GridConfig
  ): FlexibleWidgetPosition {
    // 기존 mapLegacyToFlexible 함수 사용
    const flexiblePosition = mapLegacyToFlexible(position);
    
    // 그리드 설정에 맞게 조정
    const maxColumns = gridConfig.columns;
    
    // 컬럼 범위 조정
    if (flexiblePosition.gridColumnEnd > maxColumns + 1) {
      const width = flexiblePosition.width;
      flexiblePosition.gridColumnEnd = maxColumns + 1;
      flexiblePosition.gridColumnStart = Math.max(1, maxColumns + 1 - width);
      flexiblePosition.width = Math.min(width, maxColumns);
    }
    
    return flexiblePosition;
  }
  
  /**
   * 최적 위치 계산 (재배치)
   */
  private calculateOptimalPosition(
    widget: Widget,
    gridConfig: GridConfig
  ): FlexibleWidgetPosition {
    // 크기 제약 고려
    const maxWidth = Math.min(widget.position.width, gridConfig.columns);
    const width = Math.max(1, maxWidth);
    const height = Math.max(1, widget.position.height);
    
    // 기본 위치 (좌상단부터 시작)
    return {
      gridColumnStart: 1,
      gridColumnEnd: width + 1,
      gridRowStart: 1,
      gridRowEnd: height + 1,
      width,
      height,
      minWidth: 1,
      maxWidth: gridConfig.columns,
      minHeight: 1,
      maxHeight: 4, // 최대 4행
    };
  }
  
  /**
   * 그리드 설정 결정
   */
  private determineGridConfig(gridSize: GridSize): GridConfig {
    return {
      ...DEFAULT_GRID_CONFIG,
      columns: GRID_SIZE_TO_COLUMNS[gridSize] || 4,
    };
  }
  
  /**
   * 위젯 위치 유효성 검사
   */
  private validateWidgetPosition(
    widget: IOSStyleWidget,
    gridConfig: GridConfig
  ): boolean {
    const { position } = widget;
    
    // 범위 검사
    if (position.gridColumnStart < 1 || position.gridRowStart < 1) {
      return false;
    }
    
    if (position.gridColumnEnd > gridConfig.columns + 1) {
      return false;
    }
    
    // 크기 검사
    if (position.width < 1 || position.height < 1) {
      return false;
    }
    
    if (position.width > gridConfig.columns) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 위치 자동 수정
   */
  private autoFixPosition(
    widget: IOSStyleWidget,
    gridConfig: GridConfig
  ): IOSStyleWidget {
    const position = { ...widget.position };
    
    // 시작 위치 수정
    position.gridColumnStart = Math.max(1, position.gridColumnStart);
    position.gridRowStart = Math.max(1, position.gridRowStart);
    
    // 너비 수정
    if (position.width > gridConfig.columns) {
      position.width = gridConfig.columns;
    }
    
    // 끝 위치 수정
    if (position.gridColumnEnd > gridConfig.columns + 1) {
      position.gridColumnEnd = gridConfig.columns + 1;
      position.gridColumnStart = Math.max(1, position.gridColumnEnd - position.width);
    }
    
    position.gridRowEnd = position.gridRowStart + position.height;
    
    return {
      ...widget,
      position,
    };
  }
  
  /**
   * 충돌 해결
   */
  private resolveCollisions(
    widgets: IOSStyleWidget[],
    gridConfig: GridConfig
  ): void {
    // 2D 맵 생성
    const occupancyMap = new Map<string, string>();
    
    for (const widget of widgets) {
      const { position } = widget;
      const conflicts: IOSStyleWidget[] = [];
      
      // 충돌 검사
      for (let col = position.gridColumnStart; col < position.gridColumnEnd; col++) {
        for (let row = position.gridRowStart; row < position.gridRowEnd; row++) {
          const key = `${col},${row}`;
          const occupiedBy = occupancyMap.get(key);
          
          if (occupiedBy && occupiedBy !== widget.id) {
            const conflictWidget = widgets.find(w => w.id === occupiedBy);
            if (conflictWidget && !conflicts.includes(conflictWidget)) {
              conflicts.push(conflictWidget);
            }
          }
        }
      }
      
      // 충돌 해결
      if (conflicts.length > 0) {
        // 충돌한 위젯을 아래로 이동
        for (const conflictWidget of conflicts) {
          const maxRow = Math.max(
            ...widgets.map(w => w.position.gridRowEnd)
          );
          conflictWidget.position.gridRowStart = maxRow;
          conflictWidget.position.gridRowEnd = maxRow + conflictWidget.position.height;
        }
      }
      
      // 현재 위젯 위치 등록
      for (let col = position.gridColumnStart; col < position.gridColumnEnd; col++) {
        for (let row = position.gridRowStart; row < position.gridRowEnd; row++) {
          occupancyMap.set(`${col},${row}`, widget.id);
        }
      }
    }
  }
  
  /**
   * 백업 스냅샷 생성
   */
  private createBackupSnapshot(layout: DashboardLayout): LayoutSnapshot {
    return {
      id: `backup-${Date.now()}`,
      timestamp: new Date(),
      widgets: layout.widgets.map(w => ({
        id: w.id,
        type: w.type,
        position: mapLegacyToFlexible(w.position),
        state: {
          isLocked: w.locked || false,
          isHidden: false,
          isLoading: false,
          hasError: false,
        },
        config: w.config,
        locked: w.locked,
      })),
      description: `Backup of ${layout.name} before migration`,
    };
  }
  
  /**
   * 마이그레이션 롤백
   */
  async rollback(migrationId: string): Promise<boolean> {
    const migration = this.migrationHistory.find(
      m => m.backup.id === migrationId
    );
    
    if (!migration) {
      console.error(`Migration ${migrationId} not found`);
      return false;
    }
    
    try {
      // 백업에서 복원
      console.log(`Rolling back to ${migration.backup.id}`);
      // 실제 복원 로직은 스토어와 연동 필요
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }
  
  /**
   * 마이그레이션 히스토리 조회
   */
  getHistory(): MigrationResult[] {
    return this.migrationHistory;
  }
  
  /**
   * 마이그레이션 히스토리 초기화
   */
  clearHistory(): void {
    this.migrationHistory = [];
  }
}

// 싱글톤 인스턴스 export
export const layoutMigration = LayoutMigration.getInstance();