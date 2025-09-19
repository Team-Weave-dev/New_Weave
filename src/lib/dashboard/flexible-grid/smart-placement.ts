/**
 * Smart Placement System
 * 지능형 위젯 배치 시스템
 * 최적의 위치 추천 및 예측 배치
 */

import {
  FlexibleWidgetPosition,
  IOSStyleWidget,
  GridConfig,
} from '@/types/ios-dashboard';

/**
 * 배치 제안
 */
export interface PlacementSuggestion {
  position: FlexibleWidgetPosition;
  score: number; // 0-100, 높을수록 좋음
  reasons: string[]; // 추천 이유
  alternatives: FlexibleWidgetPosition[]; // 대안 위치들
  conflicts: string[]; // 잠재적 충돌
}

/**
 * 배치 컨텍스트
 */
export interface PlacementContext {
  widgetType: string;
  preferredSize: { width: number; height: number };
  userPreference?: 'top' | 'center' | 'bottom' | 'left' | 'right';
  relatedWidgets?: string[]; // 연관 위젯들
  importance: 'low' | 'medium' | 'high' | 'critical';
  accessibility?: boolean; // 접근성 고려 여부
}

/**
 * 드롭 예측 결과
 */
export interface DropPrediction {
  targetPosition: FlexibleWidgetPosition;
  confidence: number; // 0-1
  autoAdjustments: {
    sizeChange?: { width: number; height: number };
    positionShift?: { deltaRow: number; deltaCol: number };
  };
  affectedWidgets: string[]; // 영향받을 위젯들
  previewPosition?: FlexibleWidgetPosition; // 미리보기 위치
}

/**
 * 스마트 배치 엔진
 */
export class SmartPlacementEngine {
  private gridConfig: GridConfig;
  private widgets: Map<string, IOSStyleWidget>;
  private occupancyMap: boolean[][];
  private heatMap: number[][]; // 선호도 맵
  private placementHistory: Map<string, FlexibleWidgetPosition[]>; // 배치 히스토리

  constructor(gridConfig: GridConfig, widgets: Map<string, IOSStyleWidget>) {
    this.gridConfig = gridConfig;
    this.widgets = widgets;
    this.occupancyMap = this.createEmptyOccupancyMap();
    this.heatMap = this.createEmptyHeatMap();
    this.placementHistory = new Map();
    this.updateOccupancyMap();
    this.updateHeatMap();
  }

  /**
   * 빈 occupancy map 생성
   */
  private createEmptyOccupancyMap(): boolean[][] {
    const rows = 100;
    const cols = this.gridConfig.columns;
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  /**
   * 빈 heat map 생성
   */
  private createEmptyHeatMap(): number[][] {
    const rows = 100;
    const cols = this.gridConfig.columns;
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  /**
   * Occupancy map 업데이트
   */
  private updateOccupancyMap(): void {
    // 맵 초기화
    for (let row = 0; row < this.occupancyMap.length; row++) {
      for (let col = 0; col < this.occupancyMap[row].length; col++) {
        this.occupancyMap[row][col] = false;
      }
    }

    // 위젯들 배치
    for (const widget of this.widgets.values()) {
      this.markOccupied(widget.position);
    }
  }

  /**
   * 위젯을 occupancy map에 표시
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
   * Heat map 업데이트 (선호도 맵)
   */
  private updateHeatMap(): void {
    // 맵 초기화
    for (let row = 0; row < this.heatMap.length; row++) {
      for (let col = 0; col < this.heatMap[row].length; col++) {
        this.heatMap[row][col] = 0;
      }
    }

    // 기본 선호도 설정
    this.applyBasicPreferences();
    
    // 사용자 패턴 기반 선호도
    this.applyUserPatternPreferences();
    
    // 위젯 연관성 기반 선호도
    this.applyWidgetAffinityPreferences();
  }

  /**
   * 기본 선호도 적용
   */
  private applyBasicPreferences(): void {
    const rows = Math.min(20, this.heatMap.length);
    const cols = this.gridConfig.columns;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let score = 50; // 기본 점수

        // 상단 선호 (iOS 스타일)
        if (row < 5) score += 20;
        else if (row < 10) score += 10;

        // 좌상단 코너 선호
        if (row < 3 && col < 2) score += 15;

        // 우하단 페널티 (스크롤 위험)
        if (row > 15) score -= 15;
        if (col > cols - 2) score -= 10;

        // 중앙 열 선호 (균형감)
        const centerCol = Math.floor(cols / 2);
        const colDistance = Math.abs(col - centerCol);
        score += Math.max(0, 10 - colDistance * 2);

        this.heatMap[row][col] = Math.max(0, Math.min(100, score));
      }
    }
  }

  /**
   * 사용자 패턴 기반 선호도 적용
   */
  private applyUserPatternPreferences(): void {
    // 배치 히스토리 분석
    for (const [widgetId, positions] of this.placementHistory) {
      for (const position of positions) {
        const startRow = position.gridRowStart - 1;
        const startCol = position.gridColumnStart - 1;
        
        // 주변 영역에 선호도 보너스
        for (let row = Math.max(0, startRow - 2); row <= Math.min(this.heatMap.length - 1, startRow + 2); row++) {
          for (let col = Math.max(0, startCol - 2); col <= Math.min(this.gridConfig.columns - 1, startCol + 2); col++) {
            const distance = Math.abs(row - startRow) + Math.abs(col - startCol);
            const bonus = Math.max(0, 5 - distance);
            this.heatMap[row][col] = Math.min(100, this.heatMap[row][col] + bonus);
          }
        }
      }
    }
  }

  /**
   * 위젯 연관성 기반 선호도 적용
   */
  private applyWidgetAffinityPreferences(): void {
    // 유사한 타입의 위젯들끼리 가까이 배치 선호
    const widgetGroups = this.groupWidgetsByType();
    
    for (const [type, widgets] of widgetGroups) {
      if (widgets.length > 1) {
        // 그룹의 중심점 계산
        const centerRow = widgets.reduce((sum, w) => sum + w.position.gridRowStart, 0) / widgets.length;
        const centerCol = widgets.reduce((sum, w) => sum + w.position.gridColumnStart, 0) / widgets.length;
        
        // 중심점 주변에 보너스
        const radius = 3;
        for (let row = Math.max(0, Math.floor(centerRow - radius)); 
             row <= Math.min(this.heatMap.length - 1, Math.floor(centerRow + radius)); 
             row++) {
          for (let col = Math.max(0, Math.floor(centerCol - radius)); 
               col <= Math.min(this.gridConfig.columns - 1, Math.floor(centerCol + radius)); 
               col++) {
            const distance = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
            if (distance <= radius) {
              const bonus = Math.max(0, 8 - distance * 2);
              this.heatMap[row][col] = Math.min(100, this.heatMap[row][col] + bonus);
            }
          }
        }
      }
    }
  }

  /**
   * 위젯을 타입별로 그룹화
   */
  private groupWidgetsByType(): Map<string, IOSStyleWidget[]> {
    const groups = new Map<string, IOSStyleWidget[]>();
    
    for (const widget of this.widgets.values()) {
      const type = widget.type || 'default';
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(widget);
    }
    
    return groups;
  }

  /**
   * 스마트 배치 제안 생성
   */
  public generatePlacementSuggestions(
    context: PlacementContext,
    maxSuggestions: number = 5
  ): PlacementSuggestion[] {
    const { preferredSize } = context;
    const candidates: PlacementSuggestion[] = [];

    // 가능한 모든 위치 탐색
    for (let row = 1; row <= this.occupancyMap.length - preferredSize.height + 1; row++) {
      for (let col = 1; col <= this.gridConfig.columns - preferredSize.width + 1; col++) {
        if (this.canPlaceAt(row, col, preferredSize.width, preferredSize.height)) {
          const position: FlexibleWidgetPosition = {
            gridRowStart: row,
            gridRowEnd: row + preferredSize.height,
            gridColumnStart: col,
            gridColumnEnd: col + preferredSize.width,
            width: preferredSize.width,
            height: preferredSize.height,
          };

          const suggestion = this.evaluatePlacement(position, context);
          candidates.push(suggestion);
        }
      }
    }

    // 점수순으로 정렬하고 상위 N개 반환
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  /**
   * 배치 평가
   */
  private evaluatePlacement(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): PlacementSuggestion {
    let score = 0;
    const reasons: string[] = [];
    const conflicts: string[] = [];

    // Heat map 기반 점수
    const heatScore = this.calculateHeatScore(position);
    score += heatScore * 0.3;
    if (heatScore > 70) reasons.push('선호도가 높은 위치');
    if (heatScore < 30) reasons.push('선호도가 낮은 위치');

    // 사용자 선호도 점수
    const preferenceScore = this.calculatePreferenceScore(position, context);
    score += preferenceScore * 0.2;
    if (preferenceScore > 80) reasons.push('사용자 선호도 일치');

    // 접근성 점수
    const accessibilityScore = this.calculateAccessibilityScore(position, context);
    score += accessibilityScore * 0.15;
    if (accessibilityScore > 80) reasons.push('접근성이 우수함');

    // 근접성 점수 (관련 위젯과의 거리)
    const proximityScore = this.calculateProximityScore(position, context);
    score += proximityScore * 0.2;
    if (proximityScore > 70) reasons.push('관련 위젯과 가까움');

    // 레이아웃 균형 점수
    const balanceScore = this.calculateBalanceScore(position);
    score += balanceScore * 0.15;
    if (balanceScore > 80) reasons.push('레이아웃 균형이 좋음');

    // 잠재적 충돌 검사
    const potentialConflicts = this.checkPotentialConflicts(position, context);
    conflicts.push(...potentialConflicts);
    if (potentialConflicts.length > 0) {
      score -= potentialConflicts.length * 10;
    }

    // 대안 위치 생성
    const alternatives = this.generateAlternativePositions(position, context);

    return {
      position,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      alternatives,
      conflicts,
    };
  }

  /**
   * Heat map 기반 점수 계산
   */
  private calculateHeatScore(position: FlexibleWidgetPosition): number {
    let totalScore = 0;
    let cellCount = 0;

    for (let row = position.gridRowStart - 1; row < position.gridRowEnd - 1; row++) {
      for (let col = position.gridColumnStart - 1; col < position.gridColumnEnd - 1; col++) {
        if (this.heatMap[row] && this.heatMap[row][col] !== undefined) {
          totalScore += this.heatMap[row][col];
          cellCount++;
        }
      }
    }

    return cellCount > 0 ? totalScore / cellCount : 0;
  }

  /**
   * 사용자 선호도 점수 계산
   */
  private calculatePreferenceScore(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): number {
    const { userPreference } = context;
    if (!userPreference) return 50;

    const rows = this.occupancyMap.length;
    const cols = this.gridConfig.columns;
    const row = position.gridRowStart;
    const col = position.gridColumnStart;

    switch (userPreference) {
      case 'top':
        return Math.max(0, 100 - (row - 1) * 10);
      case 'center':
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        return Math.max(0, 100 - distance * 5);
      case 'bottom':
        return Math.max(0, (row - 1) * 5);
      case 'left':
        return Math.max(0, 100 - (col - 1) * 15);
      case 'right':
        return Math.max(0, (col - 1) * 10);
      default:
        return 50;
    }
  }

  /**
   * 접근성 점수 계산
   */
  private calculateAccessibilityScore(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): number {
    if (!context.accessibility) return 50;

    let score = 50;

    // 상단 영역 선호 (스크롤 없이 접근 가능)
    if (position.gridRowStart <= 5) score += 30;
    else if (position.gridRowStart <= 10) score += 15;

    // 좌측 영역 선호 (왼손 접근 용이)
    if (position.gridColumnStart <= 2) score += 20;

    // 대형 위젯일 경우 추가 보너스 (터치 용이)
    if (position.width >= 2 && position.height >= 2) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 근접성 점수 계산
   */
  private calculateProximityScore(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): number {
    const { relatedWidgets } = context;
    if (!relatedWidgets || relatedWidgets.length === 0) return 50;

    let totalDistance = 0;
    let count = 0;

    for (const widgetId of relatedWidgets) {
      const widget = this.widgets.get(widgetId);
      if (widget) {
        const distance = this.calculateDistance(position, widget.position);
        totalDistance += distance;
        count++;
      }
    }

    if (count === 0) return 50;

    const avgDistance = totalDistance / count;
    // 거리 3 이하면 만점, 거리 10 이상이면 0점
    return Math.max(0, Math.min(100, 100 - (avgDistance - 3) * 10));
  }

  /**
   * 위치 간 거리 계산
   */
  private calculateDistance(
    pos1: FlexibleWidgetPosition,
    pos2: FlexibleWidgetPosition
  ): number {
    const row1 = (pos1.gridRowStart + pos1.gridRowEnd) / 2;
    const col1 = (pos1.gridColumnStart + pos1.gridColumnEnd) / 2;
    const row2 = (pos2.gridRowStart + pos2.gridRowEnd) / 2;
    const col2 = (pos2.gridColumnStart + pos2.gridColumnEnd) / 2;

    return Math.sqrt(Math.pow(row1 - row2, 2) + Math.pow(col1 - col2, 2));
  }

  /**
   * 레이아웃 균형 점수 계산
   */
  private calculateBalanceScore(position: FlexibleWidgetPosition): number {
    // 새 위젯 추가 후의 무게중심 계산
    const widgets = Array.from(this.widgets.values());
    const totalWeight = widgets.length + 1;

    let totalRowWeight = position.gridRowStart;
    let totalColWeight = position.gridColumnStart;

    for (const widget of widgets) {
      totalRowWeight += widget.position.gridRowStart;
      totalColWeight += widget.position.gridColumnStart;
    }

    const centerRow = totalRowWeight / totalWeight;
    const centerCol = totalColWeight / totalWeight;

    // 이상적인 중심점과의 차이
    const idealCenterRow = this.occupancyMap.length / 2;
    const idealCenterCol = this.gridConfig.columns / 2;

    const rowDiff = Math.abs(centerRow - idealCenterRow);
    const colDiff = Math.abs(centerCol - idealCenterCol);

    const maxDiff = Math.max(idealCenterRow, idealCenterCol);
    const normalizedDiff = (rowDiff + colDiff) / (2 * maxDiff);

    return Math.max(0, 100 - normalizedDiff * 100);
  }

  /**
   * 잠재적 충돌 검사
   */
  private checkPotentialConflicts(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): string[] {
    const conflicts: string[] = [];

    // 중요도가 높은 위젯들과의 간섭 확인
    for (const widget of this.widgets.values()) {
      const distance = this.calculateDistance(position, widget.position);
      
      // 너무 가깝다면 충돌 가능성
      if (distance < 2) {
        conflicts.push(`${widget.id}와 너무 가까움`);
      }

      // 같은 타입의 위젯과 겹치는 기능 영역
      if (widget.type === context.widgetType && distance < 3) {
        conflicts.push(`동일 타입 위젯과 기능 중복 가능`);
      }
    }

    // 스크롤 영역 확인
    if (position.gridRowStart > 15) {
      conflicts.push('스크롤 영역에 배치됨');
    }

    // 그리드 경계 근처
    if (position.gridColumnEnd > this.gridConfig.columns - 1) {
      conflicts.push('오른쪽 경계에 너무 가까움');
    }

    return conflicts;
  }

  /**
   * 대안 위치 생성
   */
  private generateAlternativePositions(
    position: FlexibleWidgetPosition,
    context: PlacementContext
  ): FlexibleWidgetPosition[] {
    const alternatives: FlexibleWidgetPosition[] = [];
    const { width, height } = position;

    // 인근 위치들 탐색
    const offsets = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // 상하좌우
      [-1, -1], [-1, 1], [1, -1], [1, 1], // 대각선
    ];

    for (const [deltaRow, deltaCol] of offsets) {
      const newRow = position.gridRowStart + deltaRow;
      const newCol = position.gridColumnStart + deltaCol;

      if (this.canPlaceAt(newRow, newCol, width, height)) {
        alternatives.push({
          gridRowStart: newRow,
          gridRowEnd: newRow + height,
          gridColumnStart: newCol,
          gridColumnEnd: newCol + width,
          width,
          height,
        });
      }
    }

    return alternatives.slice(0, 3); // 최대 3개만
  }

  /**
   * 배치 가능 여부 확인
   */
  private canPlaceAt(
    row: number,
    col: number,
    width: number,
    height: number
  ): boolean {
    // 경계 확인
    if (row < 1 || col < 1) return false;
    if (row + height - 1 > this.occupancyMap.length) return false;
    if (col + width - 1 > this.gridConfig.columns) return false;

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
   * 드롭 위치 예측
   */
  public predictDropPosition(
    dragPosition: { row: number; col: number },
    widgetSize: { width: number; height: number },
    context?: Partial<PlacementContext>
  ): DropPrediction {
    const basePosition: FlexibleWidgetPosition = {
      gridRowStart: Math.max(1, Math.round(dragPosition.row)),
      gridRowEnd: Math.max(1, Math.round(dragPosition.row)) + widgetSize.height,
      gridColumnStart: Math.max(1, Math.round(dragPosition.col)),
      gridColumnEnd: Math.max(1, Math.round(dragPosition.col)) + widgetSize.width,
      width: widgetSize.width,
      height: widgetSize.height,
    };

    // 가장 가까운 유효한 위치 찾기
    const targetPosition = this.findNearestValidPosition(basePosition);
    
    // 신뢰도 계산
    const distance = this.calculateDistance(basePosition, targetPosition);
    const confidence = Math.max(0, 1 - distance / 10);

    // 자동 조정 계산
    const autoAdjustments = this.calculateAutoAdjustments(basePosition, targetPosition);

    // 영향받을 위젯들
    const affectedWidgets = this.findAffectedWidgets(targetPosition);

    return {
      targetPosition,
      confidence,
      autoAdjustments,
      affectedWidgets,
      previewPosition: targetPosition,
    };
  }

  /**
   * 가장 가까운 유효한 위치 찾기
   */
  private findNearestValidPosition(
    position: FlexibleWidgetPosition
  ): FlexibleWidgetPosition {
    const { width, height } = position;
    let bestPosition = position;
    let minDistance = Infinity;

    // 나선형으로 탐색
    for (let radius = 0; radius <= 10; radius++) {
      for (let deltaRow = -radius; deltaRow <= radius; deltaRow++) {
        for (let deltaCol = -radius; deltaCol <= radius; deltaCol++) {
          if (Math.abs(deltaRow) + Math.abs(deltaCol) !== radius && radius > 0) continue;

          const newRow = position.gridRowStart + deltaRow;
          const newCol = position.gridColumnStart + deltaCol;

          if (this.canPlaceAt(newRow, newCol, width, height)) {
            const candidatePosition: FlexibleWidgetPosition = {
              gridRowStart: newRow,
              gridRowEnd: newRow + height,
              gridColumnStart: newCol,
              gridColumnEnd: newCol + width,
              width,
              height,
            };

            const distance = this.calculateDistance(position, candidatePosition);
            if (distance < minDistance) {
              minDistance = distance;
              bestPosition = candidatePosition;
            }
          }
        }
      }

      // 유효한 위치를 찾았으면 중단
      if (minDistance < Infinity) break;
    }

    return bestPosition;
  }

  /**
   * 자동 조정 계산
   */
  private calculateAutoAdjustments(
    original: FlexibleWidgetPosition,
    target: FlexibleWidgetPosition
  ): DropPrediction['autoAdjustments'] {
    const adjustments: DropPrediction['autoAdjustments'] = {};

    // 크기 변경 체크
    if (original.width !== target.width || original.height !== target.height) {
      adjustments.sizeChange = {
        width: target.width,
        height: target.height,
      };
    }

    // 위치 이동 체크
    const deltaRow = target.gridRowStart - original.gridRowStart;
    const deltaCol = target.gridColumnStart - original.gridColumnStart;
    
    if (deltaRow !== 0 || deltaCol !== 0) {
      adjustments.positionShift = { deltaRow, deltaCol };
    }

    return adjustments;
  }

  /**
   * 영향받을 위젯들 찾기
   */
  private findAffectedWidgets(position: FlexibleWidgetPosition): string[] {
    const affected: string[] = [];
    const expansionRadius = 2;

    for (const [widgetId, widget] of this.widgets) {
      const distance = this.calculateDistance(position, widget.position);
      if (distance <= expansionRadius) {
        affected.push(widgetId);
      }
    }

    return affected;
  }

  /**
   * 배치 히스토리 추가
   */
  public addToPlacementHistory(
    widgetId: string,
    position: FlexibleWidgetPosition
  ): void {
    if (!this.placementHistory.has(widgetId)) {
      this.placementHistory.set(widgetId, []);
    }

    const history = this.placementHistory.get(widgetId)!;
    history.push({ ...position });

    // 히스토리 크기 제한 (최근 10개만 유지)
    if (history.length > 10) {
      history.shift();
    }

    // Heat map 업데이트
    this.updateHeatMap();
  }

  /**
   * 크기 자동 조정 제안
   */
  public suggestSizeAdjustment(
    position: FlexibleWidgetPosition,
    availableSpace: { maxWidth: number; maxHeight: number }
  ): { width: number; height: number } | null {
    const { width, height } = position;
    const { maxWidth, maxHeight } = availableSpace;

    // 현재 크기가 이미 최적이면 null 반환
    if (width <= maxWidth && height <= maxHeight) {
      return null;
    }

    // 비율 유지하면서 크기 조정
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    const adjustedWidth = Math.floor(width * ratio);
    const adjustedHeight = Math.floor(height * ratio);

    // 최소 크기 보장
    return {
      width: Math.max(1, adjustedWidth),
      height: Math.max(1, adjustedHeight),
    };
  }

  /**
   * 그리드 설정 업데이트
   */
  public updateGridConfig(config: GridConfig): void {
    this.gridConfig = config;
    this.occupancyMap = this.createEmptyOccupancyMap();
    this.heatMap = this.createEmptyHeatMap();
    this.updateOccupancyMap();
    this.updateHeatMap();
  }

  /**
   * 위젯 맵 업데이트
   */
  public updateWidgets(widgets: Map<string, IOSStyleWidget>): void {
    this.widgets = widgets;
    this.updateOccupancyMap();
    this.updateHeatMap();
  }

  /**
   * 배치 안정성 분석
   */
  public analyzePlacementStability(): {
    overallStability: number;
    problematicWidgets: string[];
    recommendations: string[];
  } {
    const widgets = Array.from(this.widgets.values());
    let totalStability = 0;
    const problematicWidgets: string[] = [];
    const recommendations: string[] = [];

    for (const widget of widgets) {
      const context: PlacementContext = {
        widgetType: widget.type || 'default',
        preferredSize: {
          width: widget.position.width,
          height: widget.position.height,
        },
        importance: 'medium',
      };

      const suggestions = this.generatePlacementSuggestions(context, 1);
      const currentScore = suggestions.length > 0 ? suggestions[0].score : 0;
      
      totalStability += currentScore;

      if (currentScore < 50) {
        problematicWidgets.push(widget.id);
      }
    }

    const overallStability = widgets.length > 0 ? totalStability / widgets.length : 100;

    if (overallStability < 60) {
      recommendations.push('전체 레이아웃 재정렬 권장');
    }
    if (problematicWidgets.length > widgets.length * 0.3) {
      recommendations.push('다수 위젯의 위치 최적화 필요');
    }

    return {
      overallStability,
      problematicWidgets,
      recommendations,
    };
  }
}