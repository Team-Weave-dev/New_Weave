import { Widget, WidgetPosition, GridSize } from '@/types/dashboard'

// 정규화 보고서 타입
export interface NormalizationReport {
  totalWidgets: number
  invalidPositions: number
  duplicates: number
  collisions: number
  normalized: boolean
  changes: Array<{
    widgetId: string
    field: string
    oldValue: any
    newValue: any
  }>
}

// 위치 유효성 검증 결과 타입
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  severity: 'critical' | 'warning' | 'info'
}

/**
 * 위젯 위치 정규화 유틸리티
 * 위치 데이터 일관성 보장 및 충돌 방지
 * 
 * @example
 * const normalizer = new WidgetNormalizer('3x3')
 * const result = normalizer.normalizeWidgets(widgets)
 */
export class WidgetNormalizer {
  private gridColumns: number
  private gridRows: number
  private enableStrictMode: boolean
  
  constructor(gridSize: GridSize, options?: { strictMode?: boolean }) {
    const dimensions = this.getGridDimensions(gridSize)
    this.gridColumns = dimensions.columns
    this.gridRows = dimensions.rows
    this.enableStrictMode = options?.strictMode ?? false
  }
  
  private getGridDimensions(gridSize: GridSize): { columns: number; rows: number } {
    const sizeMap: Record<GridSize, { columns: number; rows: number }> = {
      '2x2': { columns: 2, rows: 2 },
      '3x3': { columns: 3, rows: 3 },
      '4x4': { columns: 4, rows: 4 },
      '5x5': { columns: 5, rows: 5 },
    }
    return sizeMap[gridSize] || { columns: 3, rows: 3 }
  }
  
  /**
   * 위젯 위치 유효성 검증 (개선된 버전)
   * 더 상세한 에러 정보와 심각도 레벨 제공
   */
  validatePosition(position: WidgetPosition): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let severity: 'critical' | 'warning' | 'info' = 'info'
    
    // 타입 체크
    if (typeof position.x !== 'number' || isNaN(position.x)) {
      errors.push('X 좌표는 유효한 숫자여야 합니다')
      severity = 'critical'
    }
    if (typeof position.y !== 'number' || isNaN(position.y)) {
      errors.push('Y 좌표는 유효한 숫자여야 합니다')
      severity = 'critical'
    }
    if (typeof position.width !== 'number' || isNaN(position.width)) {
      errors.push('너비는 유효한 숫자여야 합니다')
      severity = 'critical'
    }
    if (typeof position.height !== 'number' || isNaN(position.height)) {
      errors.push('높이는 유효한 숫자여야 합니다')
      severity = 'critical'
    }
    
    // 음수값 체크
    if (position.x < 0) {
      errors.push(`X 좌표는 0 이상이어야 합니다 (현재값: ${position.x})`)
      if (severity !== 'critical') severity = 'warning'
    }
    if (position.y < 0) {
      errors.push(`Y 좌표는 0 이상이어야 합니다 (현재값: ${position.y})`)
      if (severity !== 'critical') severity = 'warning'
    }
    if (position.width <= 0) {
      errors.push(`너비는 1 이상이어야 합니다 (현재값: ${position.width})`)
      if (severity !== 'critical') severity = 'warning'
    }
    if (position.height <= 0) {
      errors.push(`높이는 1 이상이어야 합니다 (현재값: ${position.height})`)
      if (severity !== 'critical') severity = 'warning'
    }
    
    // 그리드 범위 체크
    if (position.x >= this.gridColumns) {
      errors.push(`X 좌표는 ${this.gridColumns - 1} 이하여야 합니다 (현재값: ${position.x})`)
      if (severity !== 'critical') severity = 'warning'
    }
    if (position.y >= this.gridRows) {
      errors.push(`Y 좌표는 ${this.gridRows - 1} 이하여야 합니다 (현재값: ${position.y})`)
      if (severity !== 'critical') severity = 'warning'
    }
    
    // 크기 오버플로우 체크
    if (position.x + position.width > this.gridColumns) {
      const overflow = position.x + position.width - this.gridColumns
      warnings.push(`위젯이 그리드 너비를 ${overflow} 만큼 초과합니다`)
    }
    if (position.y + position.height > this.gridRows) {
      const overflow = position.y + position.height - this.gridRows
      warnings.push(`위젯이 그리드 높이를 ${overflow} 만큼 초과합니다`)
    }
    
    // 소수점 경고
    if (!Number.isInteger(position.x) || !Number.isInteger(position.y)) {
      warnings.push('좌표에 소수점이 포함되어 있습니다')
    }
    if (!Number.isInteger(position.width) || !Number.isInteger(position.height)) {
      warnings.push('크기에 소수점이 포함되어 있습니다')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity,
    }
  }
  
  /**
   * 단일 위치 정규화 (개선된 버전)
   * 더 정교한 정규화 로직과 소수점 처리
   */
  normalizePosition(position: WidgetPosition): WidgetPosition {
    // NaN이나 undefined 처리
    let x = Number.isFinite(position.x) ? position.x : 0
    let y = Number.isFinite(position.y) ? position.y : 0
    let width = Number.isFinite(position.width) ? position.width : 1
    let height = Number.isFinite(position.height) ? position.height : 1
    
    // 소수점 반올림 처리
    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)
    
    // 음수값 보정
    x = Math.max(0, x)
    y = Math.max(0, y)
    width = Math.max(1, width)
    height = Math.max(1, height)
    
    // 그리드 범위 내로 제한
    x = Math.min(x, this.gridColumns - 1)
    y = Math.min(y, this.gridRows - 1)
    
    // 크기가 그리드를 벗어나지 않도록 조정
    width = Math.min(width, this.gridColumns - x)
    height = Math.min(height, this.gridRows - y)
    
    // 최소 크기 보장
    width = Math.max(1, width)
    height = Math.max(1, height)
    
    return { x, y, width, height }
  }
  
  /**
   * 위치 데이터 깊은 검증
   * 위젯의 모든 속성을 검증하고 필요시 정규화
   */
  deepValidateWidget(widget: Widget): {
    isValid: boolean
    normalizedWidget: Widget
    issues: string[]
  } {
    const issues: string[] = []
    let normalizedWidget = { ...widget }
    
    // ID 검증
    if (!widget.id || typeof widget.id !== 'string') {
      issues.push('위젯 ID가 유효하지 않습니다')
      normalizedWidget.id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Type 검증
    if (!widget.type || typeof widget.type !== 'string') {
      issues.push('위젯 타입이 유효하지 않습니다')
      normalizedWidget.type = 'custom'
    }
    
    // Position 검증 및 정규화
    if (!widget.position || typeof widget.position !== 'object') {
      issues.push('위젯 위치 정보가 없습니다')
      normalizedWidget.position = { x: 0, y: 0, width: 1, height: 1 }
    } else {
      const validation = this.validatePosition(widget.position)
      if (!validation.isValid) {
        issues.push(...validation.errors)
        normalizedWidget.position = this.normalizePosition(widget.position)
      }
      if (validation.warnings.length > 0) {
        issues.push(...validation.warnings)
      }
    }
    
    return {
      isValid: issues.length === 0,
      normalizedWidget,
      issues,
    }
  }
  
  /**
   * 중복 위치 감지
   */
  detectDuplicates(widgets: Widget[]): Map<string, string[]> {
    const positionMap = new Map<string, string[]>()
    
    widgets.forEach(widget => {
      const posKey = `${widget.position.x},${widget.position.y},${widget.position.width},${widget.position.height}`
      
      if (!positionMap.has(posKey)) {
        positionMap.set(posKey, [])
      }
      positionMap.get(posKey)!.push(widget.id)
    })
    
    // 중복이 있는 위치만 필터링
    const duplicates = new Map<string, string[]>()
    positionMap.forEach((widgetIds, position) => {
      if (widgetIds.length > 1) {
        duplicates.set(position, widgetIds)
      }
    })
    
    return duplicates
  }
  
  /**
   * 충돌 감지 (겹치는 위젯)
   */
  detectCollisions(widgets: Widget[]): Array<{ widget1: string; widget2: string }> {
    const collisions: Array<{ widget1: string; widget2: string }> = []
    
    for (let i = 0; i < widgets.length - 1; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        const w1 = widgets[i]
        const w2 = widgets[j]
        
        const isColliding = 
          w1.position.x < w2.position.x + w2.position.width &&
          w1.position.x + w1.position.width > w2.position.x &&
          w1.position.y < w2.position.y + w2.position.height &&
          w1.position.y + w1.position.height > w2.position.y
        
        if (isColliding) {
          collisions.push({
            widget1: w1.id,
            widget2: w2.id,
          })
        }
      }
    }
    
    return collisions
  }
  
  /**
   * 자동 정렬 - 위젯들을 격자에 맞춰 정렬 (개선된 버전)
   * 더 효율적인 배치 알고리즘과 우선순위 기반 정렬
   */
  autoAlign(widgets: Widget[], options?: {
    preserveRelativePosition?: boolean
    compactMode?: 'none' | 'vertical' | 'horizontal' | 'both'
  }): Widget[] {
    const preserveRelative = options?.preserveRelativePosition ?? false
    const compactMode = options?.compactMode ?? 'vertical'
    
    // 우선순위 기반 정렬 (잠긴 위젯 > 큰 위젯 > 위치 순)
    const sortedWidgets = [...widgets].sort((a, b) => {
      // 1. 잠긴 위젯 우선
      if (a.locked && !b.locked) return -1
      if (!a.locked && b.locked) return 1
      
      // 2. 큰 위젯 우선 (면적 기준)
      const areaA = a.position.width * a.position.height
      const areaB = b.position.width * b.position.height
      if (areaA !== areaB) return areaB - areaA
      
      // 3. 현재 위치 기준 (y, x 순)
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y
      }
      return a.position.x - b.position.x
    })
    
    // 그리드 맵 생성 (행 x 열)
    const grid: (string | null)[][] = Array(this.gridRows)
      .fill(null)
      .map(() => Array(this.gridColumns).fill(null))
    
    // 정렬된 위젯 배열
    const alignedWidgets: Widget[] = []
    
    // 각 위젯을 최적 위치에 배치
    sortedWidgets.forEach(widget => {
      const normalizedPos = this.normalizePosition(widget.position)
      const { width, height } = normalizedPos
      
      // 잠긴 위젯은 현재 위치 유지
      if (widget.locked) {
        // 그리드에 배치
        for (let h = 0; h < height; h++) {
          for (let w = 0; w < width; w++) {
            const gridY = normalizedPos.y + h
            const gridX = normalizedPos.x + w
            if (gridY < this.gridRows && gridX < this.gridColumns) {
              grid[gridY][gridX] = widget.id
            }
          }
        }
        
        alignedWidgets.push({
          ...widget,
          position: normalizedPos,
        })
        return
      }
      
      // 최적 위치 찾기
      let bestPosition: WidgetPosition | null = null
      
      if (preserveRelative) {
        // 원래 위치와 가장 가까운 빈 공간 찾기
        bestPosition = this.findNearestEmptySpace(
          grid,
          normalizedPos,
          width,
          height
        )
      } else {
        // Compact 모드에 따른 최적 위치 찾기
        bestPosition = this.findBestCompactPosition(
          grid,
          width,
          height,
          compactMode
        )
      }
      
      // 배치할 공간이 없으면 그리드 확장을 고려
      if (!bestPosition && this.enableStrictMode) {
        console.warn(`위젯 ${widget.id}를 배치할 공간이 없습니다`)
        bestPosition = normalizedPos // 원래 위치 유지
      } else if (!bestPosition) {
        // 그리드 끝에 배치
        bestPosition = this.findPositionAtEnd(grid, width, height)
      }
      
      // 그리드에 배치
      if (bestPosition) {
        for (let h = 0; h < height; h++) {
          for (let w = 0; w < width; w++) {
            const gridY = bestPosition.y + h
            const gridX = bestPosition.x + w
            if (gridY < this.gridRows && gridX < this.gridColumns) {
              grid[gridY][gridX] = widget.id
            }
          }
        }
      }
      
      alignedWidgets.push({
        ...widget,
        position: bestPosition || normalizedPos,
      })
    })
    
    return alignedWidgets
  }
  
  /**
   * 가장 가까운 빈 공간 찾기
   */
  private findNearestEmptySpace(
    grid: (string | null)[][],
    targetPos: WidgetPosition,
    width: number,
    height: number
  ): WidgetPosition | null {
    let minDistance = Infinity
    let bestPosition: WidgetPosition | null = null
    
    for (let y = 0; y <= this.gridRows - height; y++) {
      for (let x = 0; x <= this.gridColumns - width; x++) {
        if (this.canPlaceWidget(grid, x, y, width, height)) {
          // 맨하탄 거리 계산
          const distance = Math.abs(x - targetPos.x) + Math.abs(y - targetPos.y)
          if (distance < minDistance) {
            minDistance = distance
            bestPosition = { x, y, width, height }
          }
        }
      }
    }
    
    return bestPosition
  }
  
  /**
   * Compact 모드에 따른 최적 위치 찾기
   */
  private findBestCompactPosition(
    grid: (string | null)[][],
    width: number,
    height: number,
    compactMode: 'none' | 'vertical' | 'horizontal' | 'both'
  ): WidgetPosition | null {
    // vertical: 위에서 아래로 빈틈없이
    // horizontal: 왼쪽에서 오른쪽으로 빈틈없이
    // both: 왼쪽 위 모서리부터 빈틈없이
    
    if (compactMode === 'vertical' || compactMode === 'both') {
      // 열 우선 검색
      for (let x = 0; x <= this.gridColumns - width; x++) {
        for (let y = 0; y <= this.gridRows - height; y++) {
          if (this.canPlaceWidget(grid, x, y, width, height)) {
            return { x, y, width, height }
          }
        }
      }
    } else if (compactMode === 'horizontal') {
      // 행 우선 검색
      for (let y = 0; y <= this.gridRows - height; y++) {
        for (let x = 0; x <= this.gridColumns - width; x++) {
          if (this.canPlaceWidget(grid, x, y, width, height)) {
            return { x, y, width, height }
          }
        }
      }
    } else {
      // none: 원래 위치 선호
      for (let y = 0; y <= this.gridRows - height; y++) {
        for (let x = 0; x <= this.gridColumns - width; x++) {
          if (this.canPlaceWidget(grid, x, y, width, height)) {
            return { x, y, width, height }
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * 위젯을 배치할 수 있는지 확인
   */
  private canPlaceWidget(
    grid: (string | null)[][],
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        if (grid[y + h]?.[x + w] !== null) {
          return false
        }
      }
    }
    return true
  }
  
  /**
   * 그리드 끝에서 위치 찾기
   */
  private findPositionAtEnd(
    grid: (string | null)[][],
    width: number,
    height: number
  ): WidgetPosition {
    // 맨 아래 행부터 역순으로 검색
    for (let y = this.gridRows - height; y >= 0; y--) {
      for (let x = 0; x <= this.gridColumns - width; x++) {
        if (this.canPlaceWidget(grid, x, y, width, height)) {
          return { x, y, width, height }
        }
      }
    }
    
    // 기본값 (0, 0)
    return { x: 0, y: 0, width, height }
  }
  
  /**
   * 중복 위치 해결 - 중복된 위젯들을 다른 위치로 이동
   */
  resolveDuplicates(widgets: Widget[]): Widget[] {
    const duplicates = this.detectDuplicates(widgets)
    if (duplicates.size === 0) return widgets
    
    const resolvedWidgets = [...widgets]
    const grid: (string | null)[][] = Array(this.gridColumns)
      .fill(null)
      .map(() => Array(this.gridColumns).fill(null))
    
    // 현재 위젯 위치를 그리드에 표시
    resolvedWidgets.forEach(widget => {
      const pos = widget.position
      for (let h = 0; h < pos.height; h++) {
        for (let w = 0; w < pos.width; w++) {
          const gridY = pos.y + h
          const gridX = pos.x + w
          if (gridY < this.gridColumns && gridX < this.gridColumns) {
            // 첫 번째 위젯만 유지
            if (grid[gridY][gridX] === null) {
              grid[gridY][gridX] = widget.id
            }
          }
        }
      }
    })
    
    // 중복된 위젯들을 새 위치로 이동
    duplicates.forEach((widgetIds) => {
      // 첫 번째 위젯은 현재 위치 유지
      const [firstId, ...restIds] = widgetIds
      
      restIds.forEach(widgetId => {
        const widgetIndex = resolvedWidgets.findIndex(w => w.id === widgetId)
        if (widgetIndex === -1) return
        
        const widget = resolvedWidgets[widgetIndex]
        const { width, height } = widget.position
        
        // 빈 공간 찾기
        let newPosition: WidgetPosition | null = null
        
        for (let y = 0; y <= this.gridColumns - height; y++) {
          for (let x = 0; x <= this.gridColumns - width; x++) {
            let canPlace = true
            
            for (let h = 0; h < height && canPlace; h++) {
              for (let w = 0; w < width && canPlace; w++) {
                if (grid[y + h]?.[x + w] !== null) {
                  canPlace = false
                }
              }
            }
            
            if (canPlace) {
              newPosition = { x, y, width, height }
              
              // 그리드에 배치
              for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                  if (grid[y + h] && grid[y + h][x + w] !== undefined) {
                    grid[y + h][x + w] = widget.id
                  }
                }
              }
              break
            }
          }
          if (newPosition) break
        }
        
        // 새 위치로 업데이트
        if (newPosition) {
          resolvedWidgets[widgetIndex] = {
            ...widget,
            position: newPosition,
          }
        }
      })
    })
    
    return resolvedWidgets
  }
  
  /**
   * 전체 정규화 프로세스 (개선된 버전)
   * 변경 사항 추적과 상세한 보고서 생성
   */
  normalizeWidgets(widgets: Widget[], options?: {
    autoFix?: boolean
    preserveLayout?: boolean
    compactMode?: 'none' | 'vertical' | 'horizontal' | 'both'
  }): {
    widgets: Widget[]
    report: NormalizationReport
  } {
    const autoFix = options?.autoFix ?? true
    const preserveLayout = options?.preserveLayout ?? false
    const compactMode = options?.compactMode ?? 'vertical'
    
    const initialCount = widgets.length
    const changes: NormalizationReport['changes'] = []
    let invalidCount = 0
    
    // 1. 각 위젯 깊은 검증 및 정규화
    let normalizedWidgets = widgets.map(widget => {
      const { isValid, normalizedWidget, issues } = this.deepValidateWidget(widget)
      
      if (!isValid) {
        invalidCount++
        
        // 변경 사항 기록
        if (widget.position.x !== normalizedWidget.position.x) {
          changes.push({
            widgetId: widget.id,
            field: 'position.x',
            oldValue: widget.position.x,
            newValue: normalizedWidget.position.x,
          })
        }
        if (widget.position.y !== normalizedWidget.position.y) {
          changes.push({
            widgetId: widget.id,
            field: 'position.y',
            oldValue: widget.position.y,
            newValue: normalizedWidget.position.y,
          })
        }
        if (widget.position.width !== normalizedWidget.position.width) {
          changes.push({
            widgetId: widget.id,
            field: 'position.width',
            oldValue: widget.position.width,
            newValue: normalizedWidget.position.width,
          })
        }
        if (widget.position.height !== normalizedWidget.position.height) {
          changes.push({
            widgetId: widget.id,
            field: 'position.height',
            oldValue: widget.position.height,
            newValue: normalizedWidget.position.height,
          })
        }
      }
      
      return normalizedWidget
    })
    
    // 2. 중복 위치 감지 및 해결
    const duplicates = this.detectDuplicates(normalizedWidgets)
    if (duplicates.size > 0 && autoFix) {
      const beforePositions = new Map(
        normalizedWidgets.map(w => [w.id, { ...w.position }])
      )
      
      normalizedWidgets = this.resolveDuplicates(normalizedWidgets)
      
      // 중복 해결로 인한 변경 사항 기록
      normalizedWidgets.forEach(widget => {
        const oldPos = beforePositions.get(widget.id)
        if (oldPos && (
          oldPos.x !== widget.position.x ||
          oldPos.y !== widget.position.y
        )) {
          changes.push({
            widgetId: widget.id,
            field: 'position',
            oldValue: oldPos,
            newValue: widget.position,
          })
        }
      })
    }
    
    // 3. 충돌 감지
    const collisions = this.detectCollisions(normalizedWidgets)
    
    // 4. 충돌이 있으면 자동 정렬
    if (collisions.length > 0 && autoFix) {
      const beforePositions = new Map(
        normalizedWidgets.map(w => [w.id, { ...w.position }])
      )
      
      normalizedWidgets = this.autoAlign(normalizedWidgets, {
        preserveRelativePosition: preserveLayout,
        compactMode,
      })
      
      // 자동 정렬로 인한 변경 사항 기록
      normalizedWidgets.forEach(widget => {
        const oldPos = beforePositions.get(widget.id)
        if (oldPos && (
          oldPos.x !== widget.position.x ||
          oldPos.y !== widget.position.y ||
          oldPos.width !== widget.position.width ||
          oldPos.height !== widget.position.height
        )) {
          changes.push({
            widgetId: widget.id,
            field: 'position',
            oldValue: oldPos,
            newValue: widget.position,
          })
        }
      })
    }
    
    return {
      widgets: normalizedWidgets,
      report: {
        totalWidgets: initialCount,
        invalidPositions: invalidCount,
        duplicates: duplicates.size,
        collisions: collisions.length,
        normalized: true,
        changes,
      },
    }
  }
  
  /**
   * 위젯 레이아웃 마이그레이션
   * 이전 버전의 레이아웃을 현재 버전으로 변환
   */
  migrateWidgets(widgets: Widget[], fromGridSize: GridSize, toGridSize: GridSize): Widget[] {
    const fromDimensions = this.getGridDimensions(fromGridSize)
    const toDimensions = this.getGridDimensions(toGridSize)
    
    // 스케일 계산
    const scaleX = toDimensions.columns / fromDimensions.columns
    const scaleY = toDimensions.rows / fromDimensions.rows
    
    return widgets.map(widget => {
      const newPosition: WidgetPosition = {
        x: Math.round(widget.position.x * scaleX),
        y: Math.round(widget.position.y * scaleY),
        width: Math.max(1, Math.round(widget.position.width * scaleX)),
        height: Math.max(1, Math.round(widget.position.height * scaleY)),
      }
      
      return {
        ...widget,
        position: this.normalizePosition(newPosition),
      }
    })
  }
  
  /**
   * 레이아웃 검증 보고서 생성
   * 현재 레이아웃의 상태를 종합적으로 분석
   */
  generateLayoutReport(widgets: Widget[]): {
    isHealthy: boolean
    score: number // 0-100
    issues: Array<{
      type: 'error' | 'warning' | 'info'
      message: string
      affectedWidgets: string[]
    }>
    recommendations: string[]
  } {
    const issues: Array<{
      type: 'error' | 'warning' | 'info'
      message: string
      affectedWidgets: string[]
    }> = []
    const recommendations: string[] = []
    let score = 100
    
    // 1. 위치 유효성 검사
    widgets.forEach(widget => {
      const validation = this.validatePosition(widget.position)
      if (!validation.isValid) {
        issues.push({
          type: validation.severity === 'critical' ? 'error' : 'warning',
          message: validation.errors.join(', '),
          affectedWidgets: [widget.id],
        })
        score -= validation.severity === 'critical' ? 10 : 5
      }
    })
    
    // 2. 중복 위치 검사
    const duplicates = this.detectDuplicates(widgets)
    if (duplicates.size > 0) {
      duplicates.forEach((widgetIds, position) => {
        issues.push({
          type: 'error',
          message: `위치 ${position}에 여러 위젯이 중복됨`,
          affectedWidgets: widgetIds,
        })
        score -= 15
      })
      recommendations.push('자동 정렬 기능을 사용하여 중복 위치를 해결하세요')
    }
    
    // 3. 충돌 검사
    const collisions = this.detectCollisions(widgets)
    if (collisions.length > 0) {
      collisions.forEach(({ widget1, widget2 }) => {
        issues.push({
          type: 'warning',
          message: '위젯이 서로 겹칩니다',
          affectedWidgets: [widget1, widget2],
        })
        score -= 5
      })
      recommendations.push('위젯 크기를 조정하거나 위치를 변경하여 충돌을 해결하세요')
    }
    
    // 4. 그리드 활용도 검사
    const totalCells = this.gridColumns * this.gridRows
    const usedCells = new Set<string>()
    widgets.forEach(widget => {
      for (let h = 0; h < widget.position.height; h++) {
        for (let w = 0; w < widget.position.width; w++) {
          const y = widget.position.y + h
          const x = widget.position.x + w
          if (y < this.gridRows && x < this.gridColumns) {
            usedCells.add(`${x},${y}`)
          }
        }
      }
    })
    
    const utilizationRate = (usedCells.size / totalCells) * 100
    if (utilizationRate < 30) {
      issues.push({
        type: 'info',
        message: `그리드 활용률이 ${utilizationRate.toFixed(1)}%로 낮습니다`,
        affectedWidgets: [],
      })
      recommendations.push('더 많은 위젯을 추가하거나 그리드 크기를 줄이는 것을 고려하세요')
    } else if (utilizationRate > 80) {
      issues.push({
        type: 'info',
        message: `그리드 활용률이 ${utilizationRate.toFixed(1)}%로 높습니다`,
        affectedWidgets: [],
      })
      recommendations.push('그리드 크기를 늘리는 것을 고려하세요')
    }
    
    // 5. 위젯 크기 분포 검사
    const sizes = widgets.map(w => w.position.width * w.position.height)
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
    const maxSize = Math.max(...sizes)
    const minSize = Math.min(...sizes)
    
    if (maxSize > avgSize * 3) {
      issues.push({
        type: 'info',
        message: '매우 큰 위젯이 있습니다',
        affectedWidgets: widgets
          .filter(w => w.position.width * w.position.height === maxSize)
          .map(w => w.id),
      })
      recommendations.push('큰 위젯을 여러 개의 작은 위젯으로 분할하는 것을 고려하세요')
    }
    
    // 점수 보정 (0-100 범위)
    score = Math.max(0, Math.min(100, score))
    
    return {
      isHealthy: score >= 70,
      score,
      issues,
      recommendations,
    }
  }
}