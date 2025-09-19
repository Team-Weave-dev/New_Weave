/**
 * Auto Reflow System
 * 자동 재배치 (gravity) 시스템
 * iOS 스타일의 자동 정리 기능
 */

import {
  FlexibleWidgetPosition,
  IOSStyleWidget,
  GridConfig,
} from '@/types/ios-dashboard';

/**
 * Reflow 결과
 */
export interface ReflowResult {
  movedWidgets: {
    widgetId: string;
    oldPosition: FlexibleWidgetPosition;
    newPosition: FlexibleWidgetPosition;
  }[];
  totalMovementDistance: number;
  reflowTime: number;
  stability: number; // 0-1, 1이 가장 안정적
}

/**
 * Reflow 설정
 */
export interface ReflowConfig {
  enableGravity: boolean; // 위로 당기기
  enableLeftAlignment: boolean; // 좌측 정렬
  preserveRelativeOrder: boolean; // 상대적 순서 유지
  minimumGap: number; // 최소 간격
  maxIterations: number; // 최대 반복 횟수
  stabilityThreshold: number; // 안정성 임계값
}

/**
 * 자동 재배치 엔진
 */
export class AutoReflowEngine {
  private gridConfig: GridConfig;
  private widgets: Map<string, IOSStyleWidget>;
  private config: ReflowConfig;
  private occupancyMap: boolean[][];

  constructor(
    gridConfig: GridConfig,
    widgets: Map<string, IOSStyleWidget>,
    config: Partial<ReflowConfig> = {}
  ) {
    this.gridConfig = gridConfig;
    this.widgets = widgets;
    this.config = {
      enableGravity: true,
      enableLeftAlignment: true,
      preserveRelativeOrder: true,
      minimumGap: 0,
      maxIterations: 10,
      stabilityThreshold: 0.95,
      ...config,
    };
    this.occupancyMap = this.createEmptyOccupancyMap();
  }

  /**
   * 빈 occupancy map 생성
   */
  private createEmptyOccupancyMap(): boolean[][] {
    const rows = 100; // 충분히 큰 그리드
    const cols = this.gridConfig.columns;
    
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  /**
   * Occupancy map 초기화
   */
  private resetOccupancyMap(): void {
    for (let row = 0; row < this.occupancyMap.length; row++) {
      for (let col = 0; col < this.occupancyMap[row].length; col++) {
        this.occupancyMap[row][col] = false;
      }
    }
  }

  /**
   * 위젯을 occupancy map에 배치
   */
  private markOccupied(position: FlexibleWidgetPosition): void {
    const startRow = position.gridRowStart - 1;
    const endRow = position.gridRowEnd - 1;
    const startCol = position.gridColumnStart - 1;
    const endCol = position.gridColumnEnd - 1;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (this.occupancyMap[row] && this.occupancyMap[row][col] !== undefined) {
          this.occupancyMap[row][col] = true;
        }
      }
    }
  }

  /**
   * 메인 Auto Reflow 실행
   */
  public async executeReflow(): Promise<ReflowResult> {
    const startTime = performance.now();
    const originalPositions = new Map<string, FlexibleWidgetPosition>();

    // 원본 위치 저장
    for (const [widgetId, widget] of this.widgets) {
      originalPositions.set(widgetId, { ...widget.position });
    }

    let iteration = 0;
    let stability = 0;
    const movedWidgets: ReflowResult['movedWidgets'] = [];

    while (iteration < this.config.maxIterations && stability < this.config.stabilityThreshold) {
      const iterationResult = await this.performReflowIteration();
      
      // 이동된 위젯 추적
      for (const movement of iterationResult.movements) {
        const existingMove = movedWidgets.find(m => m.widgetId === movement.widgetId);
        if (existingMove) {
          existingMove.newPosition = movement.newPosition;
        } else {
          movedWidgets.push(movement);
        }
      }

      stability = iterationResult.stability;
      iteration++;

      // 안정성이 충분하면 종료
      if (stability >= this.config.stabilityThreshold) {
        break;
      }

      // 과도한 반복 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const endTime = performance.now();
    const totalMovementDistance = this.calculateTotalMovement(movedWidgets);

    return {
      movedWidgets,
      totalMovementDistance,
      reflowTime: endTime - startTime,
      stability,
    };
  }

  /**
   * 단일 Reflow 반복 실행
   */
  private async performReflowIteration(): Promise<{
    movements: {
      widgetId: string;
      oldPosition: FlexibleWidgetPosition;
      newPosition: FlexibleWidgetPosition;
    }[];
    stability: number;
  }> {
    this.resetOccupancyMap();
    const movements: {
      widgetId: string;
      oldPosition: FlexibleWidgetPosition;
      newPosition: FlexibleWidgetPosition;
    }[] = [];

    // 위젯을 우선순위에 따라 정렬
    const sortedWidgets = this.getSortedWidgetsForReflow();

    for (const widget of sortedWidgets) {
      const oldPosition = { ...widget.position };
      let newPosition = oldPosition;

      // Gravity 적용 (위로 당기기)
      if (this.config.enableGravity) {
        newPosition = this.applyGravity(widget, newPosition);
      }

      // 좌측 정렬 적용
      if (this.config.enableLeftAlignment) {
        newPosition = this.applyLeftAlignment(widget, newPosition);
      }

      // 위치가 변경되었으면 기록
      if (!this.arePositionsEqual(oldPosition, newPosition)) {
        widget.position = newPosition;
        movements.push({
          widgetId: widget.id,
          oldPosition,
          newPosition,
        });
      }

      // 새 위치를 occupancy map에 표시
      this.markOccupied(widget.position);
    }

    const stability = this.calculateStability(movements);

    return { movements, stability };
  }

  /**
   * Reflow를 위한 위젯 정렬
   */
  private getSortedWidgetsForReflow(): IOSStyleWidget[] {
    const widgets = Array.from(this.widgets.values());

    // 정렬 우선순위:
    // 1. 행 위치 (위쪽부터)
    // 2. 열 위치 (왼쪽부터)
    // 3. 크기 (큰 것부터)
    return widgets.sort((a, b) => {
      // 행 우선
      if (a.position.gridRowStart !== b.position.gridRowStart) {
        return a.position.gridRowStart - b.position.gridRowStart;
      }

      // 열 우선
      if (a.position.gridColumnStart !== b.position.gridColumnStart) {
        return a.position.gridColumnStart - b.position.gridColumnStart;
      }

      // 크기 우선 (면적이 큰 것부터)
      const aArea = a.position.width * a.position.height;
      const bArea = b.position.width * b.position.height;
      return bArea - aArea;
    });
  }

  /**
   * Gravity 효과 적용 (위로 당기기)
   */
  private applyGravity(
    widget: IOSStyleWidget,
    currentPosition: FlexibleWidgetPosition
  ): FlexibleWidgetPosition {
    const { width, height } = currentPosition;
    let bestRow = currentPosition.gridRowStart;

    // 위에서부터 아래로 탐색하여 가장 높은 가능한 위치 찾기
    for (let row = 1; row <= currentPosition.gridRowStart; row++) {
      if (this.canPlaceAt(row, currentPosition.gridColumnStart, width, height)) {
        bestRow = row;
        break;
      }
    }

    return {
      ...currentPosition,
      gridRowStart: bestRow,
      gridRowEnd: bestRow + height,
    };
  }

  /**
   * 좌측 정렬 적용
   */
  private applyLeftAlignment(
    widget: IOSStyleWidget,
    currentPosition: FlexibleWidgetPosition
  ): FlexibleWidgetPosition {
    const { width, height } = currentPosition;
    let bestCol = currentPosition.gridColumnStart;

    // 왼쪽부터 오른쪽으로 탐색하여 가장 왼쪽 가능한 위치 찾기
    for (let col = 1; col <= currentPosition.gridColumnStart; col++) {
      if (this.canPlaceAt(currentPosition.gridRowStart, col, width, height)) {
        bestCol = col;
        break;
      }
    }

    return {
      ...currentPosition,
      gridColumnStart: bestCol,
      gridColumnEnd: bestCol + width,
    };
  }

  /**
   * 특정 위치에 배치 가능한지 확인
   */
  private canPlaceAt(
    row: number,
    col: number,
    width: number,
    height: number
  ): boolean {
    // 경계 확인
    if (col < 1 || col + width - 1 > this.gridConfig.columns) {
      return false;
    }
    if (row < 1 || row + height - 1 > this.occupancyMap.length) {
      return false;
    }

    // 충돌 확인
    for (let r = row - 1; r < row - 1 + height; r++) {
      for (let c = col - 1; c < col - 1 + width; c++) {
        if (this.occupancyMap[r] && this.occupancyMap[r][c]) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 두 위치가 같은지 확인
   */
  private arePositionsEqual(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): boolean {
    return (
      pos1.gridRowStart === pos2.gridRowStart &&
      pos1.gridRowEnd === pos2.gridRowEnd &&
      pos1.gridColumnStart === pos2.gridColumnStart &&
      pos1.gridColumnEnd === pos2.gridColumnEnd
    );
  }

  /**
   * 안정성 계산
   */
  private calculateStability(movements: {
    widgetId: string;
    oldPosition: FlexibleWidgetPosition;
    newPosition: FlexibleWidgetPosition;
  }[]): number {
    if (movements.length === 0) return 1.0;

    const totalWidgets = this.widgets.size;
    const movedWidgets = movements.length;
    const stabilityRatio = 1 - (movedWidgets / totalWidgets);

    // 이동 거리도 고려
    const avgMovementDistance = movements.reduce((sum, movement) => {
      const distance = this.calculateMovementDistance(
        movement.oldPosition,
        movement.newPosition
      );
      return sum + distance;
    }, 0) / movements.length;

    // 거리 패널티 적용 (긴 이동일수록 불안정)
    const distancePenalty = Math.min(avgMovementDistance / 10, 0.5);

    return Math.max(0, stabilityRatio - distancePenalty);
  }

  /**
   * 이동 거리 계산
   */
  private calculateMovementDistance(
    oldPos: FlexibleWidgetPosition,
    newPos: FlexibleWidgetPosition
  ): number {
    const rowDiff = Math.abs(oldPos.gridRowStart - newPos.gridRowStart);
    const colDiff = Math.abs(oldPos.gridColumnStart - newPos.gridColumnStart);
    return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
  }

  /**
   * 총 이동 거리 계산
   */
  private calculateTotalMovement(movements: {
    widgetId: string;
    oldPosition: FlexibleWidgetPosition;
    newPosition: FlexibleWidgetPosition;
  }[]): number {
    return movements.reduce((total, movement) => {
      return total + this.calculateMovementDistance(
        movement.oldPosition,
        movement.newPosition
      );
    }, 0);
  }

  /**
   * 점진적 Reflow (부분 영역만 처리)
   */
  public async executePartialReflow(
    affectedArea: {
      minRow: number;
      maxRow: number;
      minCol: number;
      maxCol: number;
    }
  ): Promise<ReflowResult> {
    const startTime = performance.now();
    const originalPositions = new Map<string, FlexibleWidgetPosition>();

    // 영향받는 위젯들만 선택
    const affectedWidgets = this.getWidgetsInArea(affectedArea);
    
    for (const widget of affectedWidgets) {
      originalPositions.set(widget.id, { ...widget.position });
    }

    // 기존 위젯들의 occupancy map 구축 (영향받지 않는 위젯들)
    this.buildOccupancyMapForUnaffectedWidgets(affectedWidgets);

    const movedWidgets: ReflowResult['movedWidgets'] = [];

    // 영향받는 위젯들만 재배치
    const sortedAffectedWidgets = affectedWidgets.sort((a, b) => {
      if (a.position.gridRowStart !== b.position.gridRowStart) {
        return a.position.gridRowStart - b.position.gridRowStart;
      }
      return a.position.gridColumnStart - b.position.gridColumnStart;
    });

    for (const widget of sortedAffectedWidgets) {
      const oldPosition = { ...widget.position };
      let newPosition = oldPosition;

      if (this.config.enableGravity) {
        newPosition = this.applyGravity(widget, newPosition);
      }

      if (this.config.enableLeftAlignment) {
        newPosition = this.applyLeftAlignment(widget, newPosition);
      }

      if (!this.arePositionsEqual(oldPosition, newPosition)) {
        widget.position = newPosition;
        movedWidgets.push({
          widgetId: widget.id,
          oldPosition,
          newPosition,
        });
      }

      this.markOccupied(widget.position);
    }

    const endTime = performance.now();
    const totalMovementDistance = this.calculateTotalMovement(movedWidgets);

    return {
      movedWidgets,
      totalMovementDistance,
      reflowTime: endTime - startTime,
      stability: this.calculateStability(movedWidgets),
    };
  }

  /**
   * 특정 영역의 위젯들 가져오기
   */
  private getWidgetsInArea(area: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  }): IOSStyleWidget[] {
    const result: IOSStyleWidget[] = [];

    for (const widget of this.widgets.values()) {
      const pos = widget.position;
      if (
        pos.gridRowStart <= area.maxRow &&
        pos.gridRowEnd >= area.minRow &&
        pos.gridColumnStart <= area.maxCol &&
        pos.gridColumnEnd >= area.minCol
      ) {
        result.push(widget);
      }
    }

    return result;
  }

  /**
   * 영향받지 않는 위젯들의 occupancy map 구축
   */
  private buildOccupancyMapForUnaffectedWidgets(affectedWidgets: IOSStyleWidget[]): void {
    this.resetOccupancyMap();
    const affectedWidgetIds = new Set(affectedWidgets.map(w => w.id));

    for (const widget of this.widgets.values()) {
      if (!affectedWidgetIds.has(widget.id)) {
        this.markOccupied(widget.position);
      }
    }
  }

  /**
   * 빈 공간 최소화
   */
  public minimizeEmptySpace(): ReflowResult {
    const startTime = performance.now();
    const movedWidgets: ReflowResult['movedWidgets'] = [];

    // 모든 위젯을 한번에 처리하여 빈 공간 최소화
    this.resetOccupancyMap();
    const sortedWidgets = this.getSortedWidgetsForReflow();

    for (const widget of sortedWidgets) {
      const oldPosition = { ...widget.position };
      const compactPosition = this.findMostCompactPosition(widget);

      if (!this.arePositionsEqual(oldPosition, compactPosition)) {
        widget.position = compactPosition;
        movedWidgets.push({
          widgetId: widget.id,
          oldPosition,
          newPosition: compactPosition,
        });
      }

      this.markOccupied(widget.position);
    }

    const endTime = performance.now();
    const totalMovementDistance = this.calculateTotalMovement(movedWidgets);

    return {
      movedWidgets,
      totalMovementDistance,
      reflowTime: endTime - startTime,
      stability: 1.0, // 완전한 최적화이므로 안정성 최대
    };
  }

  /**
   * 가장 compact한 위치 찾기
   */
  private findMostCompactPosition(widget: IOSStyleWidget): FlexibleWidgetPosition {
    const { width, height } = widget.position;
    
    // 가장 위쪽, 가장 왼쪽 위치부터 탐색
    for (let row = 1; row <= this.occupancyMap.length - height + 1; row++) {
      for (let col = 1; col <= this.gridConfig.columns - width + 1; col++) {
        if (this.canPlaceAt(row, col, width, height)) {
          return {
            gridRowStart: row,
            gridRowEnd: row + height,
            gridColumnStart: col,
            gridColumnEnd: col + width,
            width,
            height,
          };
        }
      }
    }

    // 배치할 수 없으면 원래 위치 반환
    return widget.position;
  }

  /**
   * Reflow 설정 업데이트
   */
  public updateConfig(config: Partial<ReflowConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 그리드 설정 업데이트
   */
  public updateGridConfig(config: GridConfig): void {
    this.gridConfig = config;
    this.occupancyMap = this.createEmptyOccupancyMap();
  }

  /**
   * 위젯 맵 업데이트
   */
  public updateWidgets(widgets: Map<string, IOSStyleWidget>): void {
    this.widgets = widgets;
  }

  /**
   * 배치 안정성 검증
   */
  public validateLayoutStability(): {
    isStable: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 겹치는 위젯 확인
    const overlappingWidgets = this.findOverlappingWidgets();
    if (overlappingWidgets.length > 0) {
      issues.push(`${overlappingWidgets.length}개의 위젯이 겹침`);
      suggestions.push('Auto Reflow를 실행하여 겹침 해결');
    }

    // 불필요한 빈 공간 확인
    const emptySpaceRatio = this.calculateEmptySpaceRatio();
    if (emptySpaceRatio > 0.3) {
      issues.push(`빈 공간이 ${Math.round(emptySpaceRatio * 100)}%로 과도함`);
      suggestions.push('위젯들을 더 compact하게 배치');
    }

    // 정렬 상태 확인
    const alignmentScore = this.calculateAlignmentScore();
    if (alignmentScore < 0.7) {
      issues.push('위젯 정렬이 불규칙함');
      suggestions.push('좌측 정렬 및 Gravity 적용');
    }

    return {
      isStable: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * 겹치는 위젯 찾기
   */
  private findOverlappingWidgets(): string[] {
    const overlapping: string[] = [];
    const widgets = Array.from(this.widgets.values());

    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        if (this.doWidgetsOverlap(widgets[i], widgets[j])) {
          overlapping.push(widgets[i].id, widgets[j].id);
        }
      }
    }

    return [...new Set(overlapping)];
  }

  /**
   * 두 위젯이 겹치는지 확인
   */
  private doWidgetsOverlap(widget1: IOSStyleWidget, widget2: IOSStyleWidget): boolean {
    const pos1 = widget1.position;
    const pos2 = widget2.position;

    return !(
      pos1.gridRowEnd <= pos2.gridRowStart ||
      pos1.gridRowStart >= pos2.gridRowEnd ||
      pos1.gridColumnEnd <= pos2.gridColumnStart ||
      pos1.gridColumnStart >= pos2.gridColumnEnd
    );
  }

  /**
   * 빈 공간 비율 계산
   */
  private calculateEmptySpaceRatio(): number {
    const totalCells = this.getUsedGridArea();
    const occupiedCells = Array.from(this.widgets.values()).reduce(
      (sum, widget) => sum + (widget.position.width * widget.position.height),
      0
    );

    return totalCells > 0 ? (totalCells - occupiedCells) / totalCells : 0;
  }

  /**
   * 사용된 그리드 영역 계산
   */
  private getUsedGridArea(): number {
    if (this.widgets.size === 0) return 0;

    const widgets = Array.from(this.widgets.values());
    const maxRow = Math.max(...widgets.map(w => w.position.gridRowEnd));
    const maxCol = Math.max(...widgets.map(w => w.position.gridColumnEnd));

    return maxRow * maxCol;
  }

  /**
   * 정렬 점수 계산
   */
  private calculateAlignmentScore(): number {
    if (this.widgets.size === 0) return 1;

    const widgets = Array.from(this.widgets.values());
    let alignmentScore = 0;

    // 각 행에서 왼쪽 정렬 점수 계산
    const rowGroups = new Map<number, IOSStyleWidget[]>();
    for (const widget of widgets) {
      const row = widget.position.gridRowStart;
      if (!rowGroups.has(row)) {
        rowGroups.set(row, []);
      }
      rowGroups.get(row)!.push(widget);
    }

    for (const [, rowWidgets] of rowGroups) {
      rowWidgets.sort((a, b) => a.position.gridColumnStart - b.position.gridColumnStart);
      
      let expectedCol = 1;
      for (const widget of rowWidgets) {
        if (widget.position.gridColumnStart === expectedCol) {
          alignmentScore += 1;
        }
        expectedCol = widget.position.gridColumnEnd;
      }
    }

    return alignmentScore / widgets.length;
  }
}