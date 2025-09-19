/**
 * Collision Detection System
 * 실시간 위젯 충돌 감지 및 해결 시스템
 */

import {
  FlexibleWidgetPosition,
  IOSStyleWidget,
  CollisionResult,
  GridConfig,
} from '@/types/ios-dashboard';

/**
 * 충돌 영역 정보
 */
export interface CollisionArea {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  area: number; // 충돌 영역 크기
}

/**
 * 충돌 해결 전략
 */
export interface CollisionResolutionStrategy {
  type: 'push' | 'swap' | 'reposition' | 'reject';
  targetWidgetIds?: string[];
  suggestedPosition?: FlexibleWidgetPosition;
  cost: number; // 전략 비용 (낮을수록 좋음)
}

/**
 * 고급 충돌 결과
 */
export interface AdvancedCollisionResult extends CollisionResult {
  collisionAreas: CollisionArea[];
  resolutionStrategies: CollisionResolutionStrategy[];
  severity: 'minor' | 'moderate' | 'severe';
  canResolve: boolean;
}

/**
 * 충돌 감지 엔진
 */
export class CollisionDetectionEngine {
  private gridConfig: GridConfig;
  private widgets: Map<string, IOSStyleWidget>;

  constructor(config: GridConfig, widgets: Map<string, IOSStyleWidget>) {
    this.gridConfig = config;
    this.widgets = widgets;
  }

  /**
   * 실시간 충돌 감지
   * 성능 최적화를 위한 incremental detection
   */
  public detectCollisionRealtime(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): AdvancedCollisionResult {
    const collisionData = this.performCollisionDetection(position, excludeWidgetId);
    const resolutionStrategies = this.generateResolutionStrategies(
      collisionData,
      position,
      excludeWidgetId
    );

    return {
      ...collisionData,
      resolutionStrategies,
      severity: this.calculateSeverity(collisionData),
      canResolve: resolutionStrategies.length > 0,
    };
  }

  /**
   * 충돌 영역 계산
   */
  private calculateCollisionAreas(
    position: FlexibleWidgetPosition,
    collidingWidgets: string[]
  ): CollisionArea[] {
    const areas: CollisionArea[] = [];

    for (const widgetId of collidingWidgets) {
      const widget = this.widgets.get(widgetId);
      if (!widget) continue;

      const intersection = this.calculateIntersection(position, widget.position);
      if (intersection) {
        areas.push(intersection);
      }
    }

    return areas;
  }

  /**
   * 두 위젯 위치의 교집합 계산
   */
  private calculateIntersection(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): CollisionArea | null {
    const startRow = Math.max(pos1.gridRowStart, pos2.gridRowStart);
    const endRow = Math.min(pos1.gridRowEnd, pos2.gridRowEnd);
    const startCol = Math.max(pos1.gridColumnStart, pos2.gridColumnStart);
    const endCol = Math.min(pos1.gridColumnEnd, pos2.gridColumnEnd);

    if (startRow >= endRow || startCol >= endCol) {
      return null; // 교집합 없음
    }

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      area: (endRow - startRow) * (endCol - startCol),
    };
  }

  /**
   * 기본 충돌 감지 수행
   */
  private performCollisionDetection(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): CollisionResult & { collisionAreas: CollisionArea[] } {
    const collidingWidgets: string[] = [];

    for (const [widgetId, widget] of this.widgets) {
      if (widgetId === excludeWidgetId) continue;

      if (this.doPositionsOverlap(position, widget.position)) {
        collidingWidgets.push(widgetId);
      }
    }

    const hasCollision = collidingWidgets.length > 0;
    const collisionAreas = hasCollision 
      ? this.calculateCollisionAreas(position, collidingWidgets)
      : [];

    return {
      hasCollision,
      collidingWidgets,
      collisionAreas,
    };
  }

  /**
   * 두 위치가 겹치는지 확인
   */
  private doPositionsOverlap(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): boolean {
    return !(
      pos1.gridRowEnd <= pos2.gridRowStart ||
      pos1.gridRowStart >= pos2.gridRowEnd ||
      pos1.gridColumnEnd <= pos2.gridColumnStart ||
      pos1.gridColumnStart >= pos2.gridColumnEnd
    );
  }

  /**
   * 충돌 해결 전략 생성
   */
  private generateResolutionStrategies(
    collisionData: CollisionResult & { collisionAreas: CollisionArea[] },
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): CollisionResolutionStrategy[] {
    if (!collisionData.hasCollision) return [];

    const strategies: CollisionResolutionStrategy[] = [];

    // 1. Push 전략: 충돌한 위젯들을 밀어내기
    const pushStrategy = this.generatePushStrategy(
      collisionData.collidingWidgets,
      position
    );
    if (pushStrategy) strategies.push(pushStrategy);

    // 2. Reposition 전략: 새로운 위치 찾기
    const repositionStrategy = this.generateRepositionStrategy(
      position,
      excludeWidgetId
    );
    if (repositionStrategy) strategies.push(repositionStrategy);

    // 3. Swap 전략: 작은 위젯과 위치 바꾸기
    const swapStrategy = this.generateSwapStrategy(
      collisionData.collidingWidgets,
      position
    );
    if (swapStrategy) strategies.push(swapStrategy);

    // 비용순으로 정렬
    return strategies.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Push 전략 생성
   */
  private generatePushStrategy(
    collidingWidgets: string[],
    position: FlexibleWidgetPosition
  ): CollisionResolutionStrategy | null {
    // 충돌한 위젯들을 아래로 밀어내는 전략
    const pushDistance = position.height;
    let totalCost = 0;

    for (const widgetId of collidingWidgets) {
      const widget = this.widgets.get(widgetId);
      if (!widget) continue;

      // 밀어낸 후의 위치가 유효한지 확인
      const newRowEnd = widget.position.gridRowEnd + pushDistance;
      totalCost += pushDistance * widget.position.width; // 이동 비용
    }

    return {
      type: 'push',
      targetWidgetIds: collidingWidgets,
      cost: totalCost,
    };
  }

  /**
   * Reposition 전략 생성
   */
  private generateRepositionStrategy(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): CollisionResolutionStrategy | null {
    const suggestedPosition = this.findBestAlternativePosition(
      position,
      excludeWidgetId
    );

    if (!suggestedPosition) return null;

    // 원래 위치와의 거리를 비용으로 계산
    const distanceCost = this.calculatePositionDistance(position, suggestedPosition);

    return {
      type: 'reposition',
      suggestedPosition,
      cost: distanceCost,
    };
  }

  /**
   * Swap 전략 생성
   */
  private generateSwapStrategy(
    collidingWidgets: string[],
    position: FlexibleWidgetPosition
  ): CollisionResolutionStrategy | null {
    // 더 작은 위젯과 위치를 바꾸는 전략
    for (const widgetId of collidingWidgets) {
      const widget = this.widgets.get(widgetId);
      if (!widget) continue;

      const widgetArea = widget.position.width * widget.position.height;
      const newWidgetArea = position.width * position.height;

      // 새 위젯이 더 크면 스왑 고려
      if (newWidgetArea > widgetArea) {
        // 기존 위젯이 새 위젯의 원래 위치에 들어갈 수 있는지 확인
        const canFit = this.canWidgetFitAtPosition(
          widget,
          this.getOriginalPosition(widgetId) || position
        );

        if (canFit) {
          return {
            type: 'swap',
            targetWidgetIds: [widgetId],
            cost: Math.abs(widgetArea - newWidgetArea),
          };
        }
      }
    }

    return null;
  }

  /**
   * 위젯의 원래 위치 가져오기 (임시 구현)
   */
  private getOriginalPosition(widgetId: string): FlexibleWidgetPosition | null {
    // 실제로는 히스토리나 백업에서 가져와야 함
    const widget = this.widgets.get(widgetId);
    return widget?.position || null;
  }

  /**
   * 위젯이 특정 위치에 들어갈 수 있는지 확인
   */
  private canWidgetFitAtPosition(
    widget: IOSStyleWidget,
    position: FlexibleWidgetPosition
  ): boolean {
    return (
      widget.position.width <= position.width &&
      widget.position.height <= position.height
    );
  }

  /**
   * 최적의 대체 위치 찾기
   */
  private findBestAlternativePosition(
    position: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): FlexibleWidgetPosition | null {
    const { width, height } = position;

    // 나선형 탐색으로 가장 가까운 빈 공간 찾기
    for (let distance = 1; distance <= 10; distance++) {
      for (const [deltaRow, deltaCol] of this.generateSpiralOffsets(distance)) {
        const newRowStart = Math.max(1, position.gridRowStart + deltaRow);
        const newColStart = Math.max(1, position.gridColumnStart + deltaCol);
        const newRowEnd = newRowStart + height;
        const newColEnd = newColStart + width;

        // 그리드 경계 확인
        if (newColEnd > this.gridConfig.columns + 1) continue;

        const candidatePosition: FlexibleWidgetPosition = {
          gridRowStart: newRowStart,
          gridRowEnd: newRowEnd,
          gridColumnStart: newColStart,
          gridColumnEnd: newColEnd,
          width,
          height,
        };

        // 충돌 확인
        const collision = this.performCollisionDetection(candidatePosition, excludeWidgetId);
        if (!collision.hasCollision) {
          return candidatePosition;
        }
      }
    }

    return null;
  }

  /**
   * 나선형 오프셋 생성
   */
  private *generateSpiralOffsets(distance: number): Generator<[number, number]> {
    // 위쪽
    for (let col = -distance; col <= distance; col++) {
      yield [-distance, col];
    }
    // 오른쪽
    for (let row = -distance + 1; row <= distance; row++) {
      yield [row, distance];
    }
    // 아래쪽
    for (let col = distance - 1; col >= -distance; col--) {
      yield [distance, col];
    }
    // 왼쪽
    for (let row = distance - 1; row > -distance; row--) {
      yield [row, -distance];
    }
  }

  /**
   * 두 위치 간의 거리 계산
   */
  private calculatePositionDistance(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): number {
    const rowDiff = Math.abs(pos1.gridRowStart - pos2.gridRowStart);
    const colDiff = Math.abs(pos1.gridColumnStart - pos2.gridColumnStart);
    return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
  }

  /**
   * 충돌 심각도 계산
   */
  private calculateSeverity(
    collisionData: CollisionResult & { collisionAreas: CollisionArea[] }
  ): 'minor' | 'moderate' | 'severe' {
    if (!collisionData.hasCollision) return 'minor';

    const totalCollisionArea = collisionData.collisionAreas.reduce(
      (sum, area) => sum + area.area,
      0
    );
    const collisionWidgetCount = collisionData.collidingWidgets.length;

    if (collisionWidgetCount >= 3 || totalCollisionArea >= 6) {
      return 'severe';
    } else if (collisionWidgetCount >= 2 || totalCollisionArea >= 3) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  /**
   * 충돌 감지 성능 최적화
   * 변경된 영역만 검사하는 incremental update
   */
  public detectCollisionIncremental(
    position: FlexibleWidgetPosition,
    previousPosition?: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): AdvancedCollisionResult {
    // 이전 위치가 있으면 차이만 검사
    if (previousPosition && this.isMinimalChange(position, previousPosition)) {
      return this.detectCollisionOptimized(position, previousPosition, excludeWidgetId);
    }

    // 전체 검사
    return this.detectCollisionRealtime(position, excludeWidgetId);
  }

  /**
   * 최소 변경인지 확인
   */
  private isMinimalChange(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): boolean {
    const rowDiff = Math.abs(pos1.gridRowStart - pos2.gridRowStart);
    const colDiff = Math.abs(pos1.gridColumnStart - pos2.gridColumnStart);
    return rowDiff <= 2 && colDiff <= 2;
  }

  /**
   * 최적화된 충돌 감지
   */
  private detectCollisionOptimized(
    position: FlexibleWidgetPosition,
    previousPosition: FlexibleWidgetPosition,
    excludeWidgetId?: string
  ): AdvancedCollisionResult {
    // 영향받는 영역만 계산
    const affectedArea = this.calculateAffectedArea(position, previousPosition);
    const candidateWidgets = this.getWidgetsInArea(affectedArea, excludeWidgetId);

    // 후보 위젯들만 검사
    const collidingWidgets: string[] = [];
    for (const [widgetId, widget] of candidateWidgets) {
      if (this.doPositionsOverlap(position, widget.position)) {
        collidingWidgets.push(widgetId);
      }
    }

    const hasCollision = collidingWidgets.length > 0;
    const collisionAreas = hasCollision 
      ? this.calculateCollisionAreas(position, collidingWidgets)
      : [];

    const collisionData = {
      hasCollision,
      collidingWidgets,
      collisionAreas,
    };

    const resolutionStrategies = this.generateResolutionStrategies(
      collisionData,
      position,
      excludeWidgetId
    );

    return {
      ...collisionData,
      resolutionStrategies,
      severity: this.calculateSeverity(collisionData),
      canResolve: resolutionStrategies.length > 0,
    };
  }

  /**
   * 영향받는 영역 계산
   */
  private calculateAffectedArea(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } {
    return {
      minRow: Math.min(pos1.gridRowStart, pos2.gridRowStart),
      maxRow: Math.max(pos1.gridRowEnd, pos2.gridRowEnd),
      minCol: Math.min(pos1.gridColumnStart, pos2.gridColumnStart),
      maxCol: Math.max(pos1.gridColumnEnd, pos2.gridColumnEnd),
    };
  }

  /**
   * 특정 영역의 위젯들 가져오기
   */
  private getWidgetsInArea(
    area: {
      minRow: number;
      maxRow: number;
      minCol: number;
      maxCol: number;
    },
    excludeWidgetId?: string
  ): Map<string, IOSStyleWidget> {
    const result = new Map<string, IOSStyleWidget>();

    for (const [widgetId, widget] of this.widgets) {
      if (widgetId === excludeWidgetId) continue;

      const pos = widget.position;
      if (
        pos.gridRowStart < area.maxRow &&
        pos.gridRowEnd > area.minRow &&
        pos.gridColumnStart < area.maxCol &&
        pos.gridColumnEnd > area.minCol
      ) {
        result.set(widgetId, widget);
      }
    }

    return result;
  }

  /**
   * 그리드 설정 업데이트
   */
  public updateGridConfig(config: GridConfig): void {
    this.gridConfig = config;
  }

  /**
   * 위젯 맵 업데이트
   */
  public updateWidgets(widgets: Map<string, IOSStyleWidget>): void {
    this.widgets = widgets;
  }
}