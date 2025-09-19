/**
 * FlexibleGridEngine
 * 자동 재배치 및 충돌 감지 엔진
 * Phase 3: 고급 자동 재배치 시스템 통합
 */

import {
  FlexibleWidgetPosition,
  IOSStyleWidget,
  CollisionResult,
  GridConfig,
} from '@/types/ios-dashboard';

// Phase 3 고급 모듈들
import { 
  CollisionDetectionEngine,
  AdvancedCollisionResult,
  CollisionResolutionStrategy 
} from './collision-detection';
import { 
  AutoReflowEngine,
  ReflowResult,
  ReflowConfig 
} from './auto-reflow';
import {
  SmartPlacementEngine,
  PlacementSuggestion,
  PlacementContext,
  DropPrediction
} from './smart-placement';

/**
 * 2D Occupancy Map을 위한 셀 타입
 */
interface GridCell {
  occupied: boolean;
  widgetId: string | null;
}

/**
 * 유연한 그리드 엔진 클래스 (Phase 3 업그레이드)
 * 충돌 감지, 자동 재배치, 최적 위치 추천 기능 제공
 * 
 * Phase 3 새 기능:
 * - 고급 충돌 감지 및 해결 전략
 * - 스마트 자동 재배치 시스템
 * - 지능형 배치 추천
 */
export class FlexibleGridEngine {
  private occupancyMap: GridCell[][];
  private gridConfig: GridConfig;
  private widgets: Map<string, IOSStyleWidget>;

  // Phase 3 고급 엔진들
  private collisionEngine: CollisionDetectionEngine;
  private reflowEngine: AutoReflowEngine;
  private placementEngine: SmartPlacementEngine;

  constructor(config: GridConfig, reflowConfig?: Partial<ReflowConfig>) {
    this.gridConfig = config;
    this.widgets = new Map();
    this.occupancyMap = this.createEmptyOccupancyMap();

    // Phase 3 엔진 초기화
    this.collisionEngine = new CollisionDetectionEngine(config, this.widgets);
    this.reflowEngine = new AutoReflowEngine(config, this.widgets, reflowConfig);
    this.placementEngine = new SmartPlacementEngine(config, this.widgets);
  }

  /**
   * 빈 occupancy map 생성
   */
  private createEmptyOccupancyMap(): GridCell[][] {
    const rows = 50; // 충분히 큰 그리드 생성 (동적 확장 가능)
    const cols = this.gridConfig.columns;
    
    return Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        occupied: false,
        widgetId: null,
      }))
    );
  }

  /**
   * Occupancy map 초기화
   */
  public resetOccupancyMap(): void {
    this.occupancyMap = this.createEmptyOccupancyMap();
  }

  /**
   * 위젯을 occupancy map에 배치
   */
  private placeWidgetOnMap(widget: IOSStyleWidget): void {
    const { position } = widget;
    const startRow = position.gridRowStart - 1;
    const endRow = position.gridRowEnd - 1;
    const startCol = position.gridColumnStart - 1;
    const endCol = position.gridColumnEnd - 1;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (this.occupancyMap[row] && this.occupancyMap[row][col]) {
          this.occupancyMap[row][col] = {
            occupied: true,
            widgetId: widget.id,
          };
        }
      }
    }
  }

  /**
   * 위젯을 occupancy map에서 제거
   */
  private removeWidgetFromMap(widgetId: string): void {
    for (let row = 0; row < this.occupancyMap.length; row++) {
      for (let col = 0; col < this.occupancyMap[row].length; col++) {
        if (this.occupancyMap[row][col].widgetId === widgetId) {
          this.occupancyMap[row][col] = {
            occupied: false,
            widgetId: null,
          };
        }
      }
    }
  }

  /**
   * 위젯 추가
   */
  public addWidget(widget: IOSStyleWidget): void {
    this.widgets.set(widget.id, widget);
    this.placeWidgetOnMap(widget);
  }

  /**
   * 위젯 제거
   */
  public removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.removeWidgetFromMap(widgetId);
  }

  /**
   * 위젯 업데이트
   */
  public updateWidget(widget: IOSStyleWidget): void {
    this.removeWidgetFromMap(widget.id);
    this.widgets.set(widget.id, widget);
    this.placeWidgetOnMap(widget);
  }

  /**
   * 위젯 목록 전체 설정 (동기화용)
   */
  public setWidgets(widgets: IOSStyleWidget[]): void {
    // 기존 위젯 모두 제거
    this.widgets.clear();
    this.resetOccupancyMap();
    
    // 새 위젯들 추가
    widgets.forEach(widget => {
      this.widgets.set(widget.id, widget);
      this.placeWidgetOnMap(widget);
    });
    
    // Phase 3 엔진들도 동기화
    this.syncEngines();
  }
  
  /**
   * Occupancy Map 업데이트 - 위젯 목록을 기반으로 재구성
   */
  private updateOccupancyMap(): void {
    this.resetOccupancyMap();
    
    // 모든 위젯을 occupancy map에 다시 배치
    this.widgets.forEach(widget => {
      this.placeWidgetOnMap(widget);
    });
  }

  /**
   * 충돌 감지
   */
  public detectCollision(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): CollisionResult {
    const startRow = position.gridRowStart - 1;
    const endRow = position.gridRowEnd - 1;
    const startCol = position.gridColumnStart - 1;
    const endCol = position.gridColumnEnd - 1;

    const collidingWidgets = new Set<string>();
    let hasCollision = false;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const cell = this.occupancyMap[row]?.[col];
        if (cell?.occupied && cell.widgetId !== excludeWidgetId) {
          hasCollision = true;
          if (cell.widgetId) {
            collidingWidgets.add(cell.widgetId);
          }
        }
      }
    }

    const result: CollisionResult = {
      hasCollision,
      collidingWidgets: Array.from(collidingWidgets),
    };

    // 충돌이 있으면 대체 위치 추천
    if (hasCollision) {
      const suggestedPosition = this.findBestAvailablePosition(
        position.width,
        position.height,
        { row: startRow, col: startCol }
      );
      if (suggestedPosition) {
        result.suggestedPosition = suggestedPosition;
      }
    }

    return result;
  }

  /**
   * Auto-reflow (gravity) 기능
   * 위젯들을 위쪽으로 당겨 빈 공간을 최소화
   */
  public applyGravity(): void {
    const sortedWidgets = Array.from(this.widgets.values()).sort(
      (a, b) => a.position.gridRowStart - b.position.gridRowStart
    );

    this.resetOccupancyMap();

    for (const widget of sortedWidgets) {
      const newPosition = this.findHighestPosition(widget);
      widget.position = newPosition;
      this.placeWidgetOnMap(widget);
    }
  }

  /**
   * 위젯이 배치될 수 있는 가장 높은 위치 찾기
   */
  private findHighestPosition(widget: IOSStyleWidget): FlexibleWidgetPosition {
    const { width, height } = widget.position;
    const startCol = widget.position.gridColumnStart - 1;

    // 위에서부터 아래로 탐색하여 첫 번째 가능한 위치 찾기
    for (let row = 0; row <= this.occupancyMap.length - height; row++) {
      if (this.canPlaceAt(row, startCol, width, height, widget.id)) {
        return {
          ...widget.position,
          gridRowStart: row + 1,
          gridRowEnd: row + height + 1,
        };
      }
    }

    // 배치할 수 없으면 원래 위치 반환
    return widget.position;
  }

  /**
   * 특정 위치에 위젯을 배치할 수 있는지 확인
   */
  private canPlaceAt(
    row: number,
    col: number,
    width: number,
    height: number,
    excludeWidgetId?: string
  ): boolean {
    // 경계 체크
    if (col < 0 || col + width > this.gridConfig.columns) {
      return false;
    }
    if (row < 0 || row + height > this.occupancyMap.length) {
      return false;
    }

    // 충돌 체크
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        const cell = this.occupancyMap[r]?.[c];
        if (cell?.occupied && cell.widgetId !== excludeWidgetId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 최적의 빈 위치 찾기 (나선형 탐색)
   */
  public findBestAvailablePosition(
    width: number,
    height: number,
    preferredPosition?: { row: number; col: number }
  ): FlexibleWidgetPosition | null {
    const startRow = preferredPosition?.row ?? 0;
    const startCol = preferredPosition?.col ?? 0;

    // 나선형 탐색 패턴
    const spiralSearch = this.generateSpiralPattern(startRow, startCol);

    for (const [row, col] of spiralSearch) {
      if (this.canPlaceAt(row, col, width, height)) {
        return {
          gridColumnStart: col + 1,
          gridColumnEnd: col + width + 1,
          gridRowStart: row + 1,
          gridRowEnd: row + height + 1,
          width,
          height,
        };
      }
    }

    // 나선형 탐색 실패 시 전체 그리드 탐색
    for (let row = 0; row <= this.occupancyMap.length - height; row++) {
      for (let col = 0; col <= this.gridConfig.columns - width; col++) {
        if (this.canPlaceAt(row, col, width, height)) {
          return {
            gridColumnStart: col + 1,
            gridColumnEnd: col + width + 1,
            gridRowStart: row + 1,
            gridRowEnd: row + height + 1,
            width,
            height,
          };
        }
      }
    }

    return null;
  }

  /**
   * 나선형 패턴 생성
   */
  private *generateSpiralPattern(
    centerRow: number,
    centerCol: number,
    maxDistance: number = 20
  ): Generator<[number, number]> {
    yield [centerRow, centerCol];

    for (let distance = 1; distance <= maxDistance; distance++) {
      // 위
      for (let col = centerCol - distance; col <= centerCol + distance; col++) {
        yield [centerRow - distance, col];
      }
      // 오른쪽
      for (let row = centerRow - distance + 1; row <= centerRow + distance; row++) {
        yield [row, centerCol + distance];
      }
      // 아래
      for (let col = centerCol + distance - 1; col >= centerCol - distance; col--) {
        yield [centerRow + distance, col];
      }
      // 왼쪽
      for (let row = centerRow + distance - 1; row > centerRow - distance; row--) {
        yield [row, centerCol - distance];
      }
    }
  }

  /**
   * 위젯 이동
   */
  public moveWidget(
    widgetId: string,
    newPosition: FlexibleWidgetPosition
  ): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    // 충돌 감지
    const collision = this.detectCollision(newPosition, widgetId);
    if (collision.hasCollision) {
      // 충돌한 위젯들을 아래로 밀기
      this.pushWidgetsDown(collision.collidingWidgets, newPosition.height);
    }

    // 위젯 이동
    this.removeWidgetFromMap(widgetId);
    widget.position = newPosition;
    this.placeWidgetOnMap(widget);

    // gravity 적용
    this.applyGravity();

    return true;
  }

  /**
   * 충돌한 위젯들을 아래로 밀기
   */
  private pushWidgetsDown(widgetIds: string[], pushDistance: number): void {
    for (const widgetId of widgetIds) {
      const widget = this.widgets.get(widgetId);
      if (widget) {
        widget.position.gridRowStart += pushDistance;
        widget.position.gridRowEnd += pushDistance;
      }
    }
  }

  /**
   * 위젯 크기 조절
   */
  public resizeWidget(
    widgetId: string,
    newWidth: number,
    newHeight: number
  ): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    const newPosition: FlexibleWidgetPosition = {
      ...widget.position,
      width: newWidth,
      height: newHeight,
      gridColumnEnd: widget.position.gridColumnStart + newWidth,
      gridRowEnd: widget.position.gridRowStart + newHeight,
    };

    // 충돌 감지
    const collision = this.detectCollision(newPosition, widgetId);
    if (collision.hasCollision) {
      // 크기 조절이 불가능한 경우 false 반환
      if (!collision.suggestedPosition) {
        return false;
      }
      // 대체 위치 사용
      newPosition.gridColumnStart = collision.suggestedPosition.gridColumnStart;
      newPosition.gridRowStart = collision.suggestedPosition.gridRowStart;
      newPosition.gridColumnEnd = collision.suggestedPosition.gridColumnEnd;
      newPosition.gridRowEnd = collision.suggestedPosition.gridRowEnd;
    }

    // 위젯 크기 조절
    this.updateWidget({ ...widget, position: newPosition });
    this.applyGravity();

    return true;
  }

  /**
   * 레이아웃 유효성 검사
   */
  public validateLayout(): boolean {
    // 모든 위젯이 그리드 내에 있는지 확인
    for (const widget of this.widgets.values()) {
      const { position } = widget;
      if (
        position.gridColumnStart < 1 ||
        position.gridColumnEnd > this.gridConfig.columns + 1 ||
        position.gridRowStart < 1 ||
        position.width < 1 ||
        position.height < 1
      ) {
        return false;
      }
    }

    // 충돌 확인
    this.resetOccupancyMap();
    for (const widget of this.widgets.values()) {
      const collision = this.detectCollision(widget.position, widget.id);
      if (collision.hasCollision) {
        return false;
      }
      this.placeWidgetOnMap(widget);
    }

    return true;
  }

  /**
   * 현재 레이아웃 내보내기
   */
  public exportLayout(): IOSStyleWidget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * 레이아웃 가져오기
   */
  public importLayout(widgets: IOSStyleWidget[]): void {
    this.widgets.clear();
    this.resetOccupancyMap();

    for (const widget of widgets) {
      this.addWidget(widget);
    }
  }

  /**
   * 그리드 설정 업데이트 (Phase 3 업그레이드)
   */
  public updateGridConfig(config: GridConfig): void {
    this.gridConfig = config;
    this.resetOccupancyMap();
    
    // Phase 3 엔진들도 업데이트
    this.collisionEngine.updateGridConfig(config);
    this.reflowEngine.updateGridConfig(config);
    this.placementEngine.updateGridConfig(config);
    
    // 모든 위젯 재배치
    const widgets = Array.from(this.widgets.values());
    this.widgets.clear();
    
    for (const widget of widgets) {
      // 새 그리드에 맞게 위치 조정
      if (widget.position.gridColumnEnd > config.columns + 1) {
        widget.position.gridColumnEnd = config.columns + 1;
        widget.position.width = config.columns - widget.position.gridColumnStart + 1;
      }
      this.addWidget(widget);
    }
    
    this.applyGravity();
  }

  /**
   * 디버그용 occupancy map 출력
   */
  public debugPrintMap(): void {
    console.log('=== Occupancy Map ===');
    for (let row = 0; row < Math.min(20, this.occupancyMap.length); row++) {
      let rowStr = '';
      for (let col = 0; col < this.gridConfig.columns; col++) {
        const cell = this.occupancyMap[row][col];
        rowStr += cell.occupied ? '█' : '·';
      }
      console.log(`Row ${row + 1}: ${rowStr}`);
    }
  }

  // ========================================
  // Phase 3: 고급 자동 재배치 시스템 메서드들
  // ========================================

  /**
   * 고급 충돌 감지 (Phase 3)
   * 해결 전략과 함께 충돌 정보 제공
   */
  public detectAdvancedCollision(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): AdvancedCollisionResult {
    this.syncEngines();
    return this.collisionEngine.detectCollisionRealtime(position, excludeWidgetId);
  }

  /**
   * 증분 충돌 감지 (Phase 3)
   * 성능 최적화를 위한 변경 영역만 검사
   */
  public detectIncrementalCollision(
    position: FlexibleWidgetPosition,
    previousPosition?: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): AdvancedCollisionResult {
    this.syncEngines();
    return this.collisionEngine.detectCollisionIncremental(
      position,
      previousPosition,
      excludeWidgetId
    );
  }

  /**
   * 스마트 자동 재배치 실행 (Phase 3)
   * iOS 스타일의 gravity와 최적화된 배치
   */
  public async executeSmartReflow(): Promise<ReflowResult> {
    this.syncEngines();
    const result = await this.reflowEngine.executeReflow();
    
    // 결과를 기본 occupancy map에 반영
    this.updateOccupancyMap();
    
    return result;
  }

  /**
   * 부분 영역 재배치 (Phase 3)
   * 변경된 영역만 효율적으로 재배치
   */
  public async executePartialReflow(area: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  }): Promise<ReflowResult> {
    this.syncEngines();
    const result = await this.reflowEngine.executePartialReflow(area);
    
    this.updateOccupancyMap();
    return result;
  }

  /**
   * 빈 공간 최소화 (Phase 3)
   * 레이아웃을 가장 compact하게 정리
   */
  public minimizeEmptySpace(): ReflowResult {
    this.syncEngines();
    const result = this.reflowEngine.minimizeEmptySpace();
    
    this.updateOccupancyMap();
    return result;
  }

  /**
   * 스마트 배치 제안 생성 (Phase 3)
   * 컨텍스트 기반 최적 위치 추천
   */
  public generateSmartPlacementSuggestions(
    context: PlacementContext,
    maxSuggestions: number = 5
  ): PlacementSuggestion[] {
    this.syncEngines();
    return this.placementEngine.generatePlacementSuggestions(context, maxSuggestions);
  }

  /**
   * 픽셀 좌표를 그리드 위치로 변환
   */
  public pixelToGridPosition(pixelPosition: { x: number; y: number }): FlexibleWidgetPosition {
    // 그리드 셀 크기 계산 (rowHeight 및 컬럼 너비 기준)
    const cellWidth = this.gridConfig.containerWidth ? 
      this.gridConfig.containerWidth / this.gridConfig.columns : 100;
    const cellHeight = this.gridConfig.rowHeight || 100;
    
    // 픽셀을 그리드 좌표로 변환
    const gridCol = Math.max(1, Math.ceil(pixelPosition.x / cellWidth));
    const gridRow = Math.max(1, Math.ceil(pixelPosition.y / cellHeight));
    
    return {
      gridColumnStart: gridCol,
      gridColumnEnd: gridCol + 1,
      gridRowStart: gridRow,
      gridRowEnd: gridRow + 1,
      width: 1,
      height: 1,
    };
  }

  /**
   * 드롭 위치 예측 (Phase 3)
   * 드래그 중인 위젯의 최적 배치 위치 예측
   */
  public predictDropPosition(
    dragPosition: { row: number; col: number },
    widgetSize: { width: number; height: number },
    context?: Partial<PlacementContext>
  ): DropPrediction {
    this.syncEngines();
    return this.placementEngine.predictDropPosition(dragPosition, widgetSize, context);
  }

  /**
   * 배치 히스토리 추가 (Phase 3)
   * 사용자 패턴 학습을 위한 히스토리 기록
   */
  public addToPlacementHistory(
    widgetId: string,
    position: FlexibleWidgetPosition
  ): void {
    this.placementEngine.addToPlacementHistory(widgetId, position);
  }

  /**
   * 크기 자동 조정 제안 (Phase 3)
   * 사용 가능한 공간에 맞는 최적 크기 제안
   */
  public suggestSizeAdjustment(
    position: FlexibleWidgetPosition,
    availableSpace: { maxWidth: number; maxHeight: number }
  ): { width: number; height: number } | null {
    return this.placementEngine.suggestSizeAdjustment(position, availableSpace);
  }

  /**
   * 레이아웃 안정성 검증 (Phase 3)
   * 현재 레이아웃의 문제점과 개선 제안
   */
  public validateLayoutStability(): {
    isStable: boolean;
    issues: string[];
    suggestions: string[];
    placementStability: {
      overallStability: number;
      problematicWidgets: string[];
      recommendations: string[];
    };
  } {
    this.syncEngines();
    
    // Auto Reflow 엔진의 안정성 검증
    const reflowValidation = this.reflowEngine.validateLayoutStability();
    
    // Smart Placement 엔진의 배치 안정성 분석
    const placementStability = this.placementEngine.analyzePlacementStability();
    
    return {
      ...reflowValidation,
      placementStability,
    };
  }

  /**
   * Reflow 설정 업데이트 (Phase 3)
   */
  public updateReflowConfig(config: Partial<ReflowConfig>): void {
    this.reflowEngine.updateConfig(config);
  }

  /**
   * 위젯 맵과 엔진들 동기화 (Phase 3)
   * 내부 상태 일관성 유지
   */
  private syncEngines(): void {
    this.collisionEngine.updateWidgets(this.widgets);
    this.reflowEngine.updateWidgets(this.widgets);
    this.placementEngine.updateWidgets(this.widgets);
  }

  /**
   * 위젯 추가 (Phase 3 업그레이드)
   * 기존 메서드에 엔진 동기화 추가
   */
  public addWidget(widget: IOSStyleWidget): void {
    this.widgets.set(widget.id, widget);
    this.placeWidgetOnMap(widget);
    this.syncEngines();
  }

  /**
   * 위젯 제거 (Phase 3 업그레이드)
   * 기존 메서드에 엔진 동기화 추가
   */
  public removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.removeWidgetFromMap(widgetId);
    this.syncEngines();
  }

  /**
   * 위젯 업데이트 (Phase 3 업그레이드)
   * 기존 메서드에 엔진 동기화 추가
   */
  public updateWidget(widget: IOSStyleWidget): void {
    this.removeWidgetFromMap(widget.id);
    this.widgets.set(widget.id, widget);
    this.placeWidgetOnMap(widget);
    this.syncEngines();
  }

  /**
   * 위젯 이동 (Phase 3 업그레이드)
   * 고급 충돌 감지와 스마트 재배치 적용
   */
  public async moveWidgetSmart(
    widgetId: string,
    newPosition: FlexibleWidgetPosition
  ): Promise<{
    success: boolean;
    finalPosition: FlexibleWidgetPosition;
    appliedStrategy?: CollisionResolutionStrategy;
    reflowResult?: ReflowResult;
  }> {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      return {
        success: false,
        finalPosition: newPosition,
      };
    }

    // 고급 충돌 감지
    const collision = this.detectAdvancedCollision(newPosition, widgetId);
    let finalPosition = newPosition;
    let appliedStrategy: CollisionResolutionStrategy | undefined;

    if (collision.hasCollision && collision.canResolve) {
      // 최적의 해결 전략 선택
      const bestStrategy = collision.resolutionStrategies[0];
      appliedStrategy = bestStrategy;

      if (bestStrategy.type === 'reposition' && bestStrategy.suggestedPosition) {
        finalPosition = bestStrategy.suggestedPosition;
      }
    }

    // 위젯 이동
    this.removeWidgetFromMap(widgetId);
    widget.position = finalPosition;
    this.placeWidgetOnMap(widget);

    // 배치 히스토리 기록
    this.addToPlacementHistory(widgetId, finalPosition);

    // 스마트 재배치 적용
    const reflowResult = await this.executeSmartReflow();

    return {
      success: true,
      finalPosition: widget.position, // reflow 후의 최종 위치
      appliedStrategy,
      reflowResult,
    };
  }

  /**
   * Phase 3 시스템 상태 정보 (디버그용)
   */
  public getPhase3SystemInfo(): {
    engineStatus: {
      collision: boolean;
      reflow: boolean;
      placement: boolean;
    };
    layoutMetrics: {
      widgetCount: number;
      occupiedCells: number;
      emptySpaceRatio: number;
      stabilityScore: number;
    };
  } {
    const stability = this.validateLayoutStability();
    const widgets = Array.from(this.widgets.values());
    const occupiedCells = widgets.reduce(
      (sum, w) => sum + (w.position.width * w.position.height),
      0
    );
    
    const maxRow = widgets.length > 0 
      ? Math.max(...widgets.map(w => w.position.gridRowEnd))
      : 0;
    const totalCells = maxRow * this.gridConfig.columns;
    const emptySpaceRatio = totalCells > 0 ? (totalCells - occupiedCells) / totalCells : 0;

    return {
      engineStatus: {
        collision: !!this.collisionEngine,
        reflow: !!this.reflowEngine,
        placement: !!this.placementEngine,
      },
      layoutMetrics: {
        widgetCount: this.widgets.size,
        occupiedCells,
        emptySpaceRatio,
        stabilityScore: stability.placementStability.overallStability,
      },
    };
  }
}