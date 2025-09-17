import { Widget, WidgetPosition, GridSize } from '@/types/dashboard'

/**
 * 위젯 위치 정규화 유틸리티
 * 위치 데이터 일관성 보장 및 충돌 방지
 */
export class WidgetNormalizer {
  private gridColumns: number
  
  constructor(gridSize: GridSize) {
    this.gridColumns = this.getGridColumns(gridSize)
  }
  
  private getGridColumns(gridSize: GridSize): number {
    const sizeMap: Record<GridSize, number> = {
      '2x2': 2,
      '3x3': 3,
      '4x4': 4,
      '5x5': 5,
    }
    return sizeMap[gridSize] || 3
  }
  
  /**
   * 위젯 위치 유효성 검증
   */
  validatePosition(position: WidgetPosition): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 음수값 체크
    if (position.x < 0) errors.push('X 좌표는 0 이상이어야 합니다')
    if (position.y < 0) errors.push('Y 좌표는 0 이상이어야 합니다')
    if (position.width <= 0) errors.push('너비는 1 이상이어야 합니다')
    if (position.height <= 0) errors.push('높이는 1 이상이어야 합니다')
    
    // 그리드 범위 체크
    if (position.x >= this.gridColumns) {
      errors.push(`X 좌표는 ${this.gridColumns - 1} 이하여야 합니다`)
    }
    if (position.y >= this.gridColumns) {
      errors.push(`Y 좌표는 ${this.gridColumns - 1} 이하여야 합니다`)
    }
    
    // 크기 오버플로우 체크
    if (position.x + position.width > this.gridColumns) {
      errors.push(`위젯이 그리드 너비를 초과합니다`)
    }
    if (position.y + position.height > this.gridColumns) {
      errors.push(`위젯이 그리드 높이를 초과합니다`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }
  
  /**
   * 단일 위치 정규화
   */
  normalizePosition(position: WidgetPosition): WidgetPosition {
    // 음수값 보정
    let x = Math.max(0, position.x)
    let y = Math.max(0, position.y)
    let width = Math.max(1, position.width)
    let height = Math.max(1, position.height)
    
    // 그리드 범위 내로 제한
    x = Math.min(x, this.gridColumns - 1)
    y = Math.min(y, this.gridColumns - 1)
    
    // 크기가 그리드를 벗어나지 않도록 조정
    width = Math.min(width, this.gridColumns - x)
    height = Math.min(height, this.gridColumns - y)
    
    return { x, y, width, height }
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
   * 자동 정렬 - 위젯들을 격자에 맞춰 정렬
   */
  autoAlign(widgets: Widget[]): Widget[] {
    // y, x 순으로 정렬
    const sortedWidgets = [...widgets].sort((a, b) => {
      if (a.locked) return 1  // 잠긴 위젯은 나중에
      if (b.locked) return -1
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y
      }
      return a.position.x - b.position.x
    })
    
    // 그리드 맵 생성
    const grid: (string | null)[][] = Array(this.gridColumns)
      .fill(null)
      .map(() => Array(this.gridColumns).fill(null))
    
    // 잠긴 위젯 먼저 배치
    const lockedWidgets = sortedWidgets.filter(w => w.locked)
    lockedWidgets.forEach(widget => {
      const pos = this.normalizePosition(widget.position)
      for (let h = 0; h < pos.height; h++) {
        for (let w = 0; w < pos.width; w++) {
          const gridY = pos.y + h
          const gridX = pos.x + w
          if (gridY < this.gridColumns && gridX < this.gridColumns) {
            grid[gridY][gridX] = widget.id
          }
        }
      }
    })
    
    // 정렬된 위젯 배열
    const alignedWidgets: Widget[] = []
    
    // 각 위젯을 최적 위치에 배치
    sortedWidgets.forEach(widget => {
      if (widget.locked) {
        alignedWidgets.push({
          ...widget,
          position: this.normalizePosition(widget.position),
        })
        return
      }
      
      const { width, height } = widget.position
      let bestPosition: WidgetPosition | null = null
      
      // 가장 위쪽 왼쪽의 빈 공간 찾기
      for (let y = 0; y <= this.gridColumns - height; y++) {
        for (let x = 0; x <= this.gridColumns - width; x++) {
          let canPlace = true
          
          // 해당 위치에 배치 가능한지 확인
          for (let h = 0; h < height && canPlace; h++) {
            for (let w = 0; w < width && canPlace; w++) {
              if (grid[y + h]?.[x + w] !== null) {
                canPlace = false
              }
            }
          }
          
          if (canPlace) {
            bestPosition = { x, y, width, height }
            
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
        if (bestPosition) break
      }
      
      // 배치할 공간이 없으면 원래 위치 유지 (정규화만)
      alignedWidgets.push({
        ...widget,
        position: bestPosition || this.normalizePosition(widget.position),
      })
    })
    
    return alignedWidgets
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
   * 전체 정규화 프로세스
   */
  normalizeWidgets(widgets: Widget[]): {
    widgets: Widget[]
    report: {
      totalWidgets: number
      invalidPositions: number
      duplicates: number
      collisions: number
      normalized: boolean
    }
  } {
    const initialCount = widgets.length
    let invalidCount = 0
    
    // 1. 각 위젯 위치 정규화
    let normalizedWidgets = widgets.map(widget => {
      const validation = this.validatePosition(widget.position)
      if (!validation.isValid) {
        invalidCount++
      }
      
      return {
        ...widget,
        position: this.normalizePosition(widget.position),
      }
    })
    
    // 2. 중복 위치 감지 및 해결
    const duplicates = this.detectDuplicates(normalizedWidgets)
    if (duplicates.size > 0) {
      normalizedWidgets = this.resolveDuplicates(normalizedWidgets)
    }
    
    // 3. 충돌 감지
    const collisions = this.detectCollisions(normalizedWidgets)
    
    // 4. 충돌이 있으면 자동 정렬
    if (collisions.length > 0) {
      normalizedWidgets = this.autoAlign(normalizedWidgets)
    }
    
    return {
      widgets: normalizedWidgets,
      report: {
        totalWidgets: initialCount,
        invalidPositions: invalidCount,
        duplicates: duplicates.size,
        collisions: collisions.length,
        normalized: true,
      },
    }
  }
}