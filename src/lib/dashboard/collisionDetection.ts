import { Widget, WidgetPosition, GridSize } from '@/types/dashboard'

/**
 * 그리드 크기에 따른 셀 수 반환
 */
export function getGridCells(gridSize: GridSize): number {
  const sizeMap = {
    '2x2': 4,
    '3x3': 9,
    '4x4': 16,
    '5x5': 25,
  }
  return sizeMap[gridSize] || 9
}

/**
 * 그리드 크기에 따른 컬럼 수 반환
 */
export function getGridColumns(gridSize: GridSize): number {
  const columnsMap = {
    '2x2': 2,
    '3x3': 3,
    '4x4': 4,
    '5x5': 5,
  }
  return columnsMap[gridSize] || 3
}

/**
 * 두 위젯 위치가 겹치는지 확인
 */
export function checkCollision(
  widget1: WidgetPosition,
  widget2: WidgetPosition
): boolean {
  // 겹치지 않는 조건을 확인
  const noOverlap = 
    widget1.x + widget1.width <= widget2.x || // widget1이 widget2의 왼쪽에 있음
    widget2.x + widget2.width <= widget1.x || // widget2가 widget1의 왼쪽에 있음
    widget1.y + widget1.height <= widget2.y || // widget1이 widget2의 위에 있음
    widget2.y + widget2.height <= widget1.y   // widget2가 widget1의 위에 있음

  return !noOverlap
}

/**
 * 위젯이 그리드 경계를 벗어나는지 확인
 */
export function isOutOfBounds(
  position: WidgetPosition,
  gridSize: GridSize
): boolean {
  const columns = getGridColumns(gridSize)
  const rows = columns // 정사각형 그리드 가정
  
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x + position.width > columns ||
    position.y + position.height > rows
  )
}

/**
 * 새로운 위치가 다른 위젯들과 충돌하는지 확인
 */
export function hasCollisionWithWidgets(
  newPosition: WidgetPosition,
  widgets: Widget[],
  excludeWidgetId?: string
): boolean {
  return widgets.some(widget => {
    // 자기 자신은 제외
    if (widget.id === excludeWidgetId) return false
    
    // 잠긴 위젯은 충돌 검사에 포함
    return checkCollision(newPosition, widget.position)
  })
}

/**
 * 유효한 드롭 위치인지 확인
 */
export function isValidDropPosition(
  position: WidgetPosition,
  widgets: Widget[],
  gridSize: GridSize,
  widgetId?: string
): boolean {
  // 경계 체크
  if (isOutOfBounds(position, gridSize)) {
    return false
  }
  
  // 충돌 체크
  if (hasCollisionWithWidgets(position, widgets, widgetId)) {
    return false
  }
  
  return true
}

/**
 * 가장 가까운 유효한 위치 찾기
 */
export function findNearestValidPosition(
  targetPosition: WidgetPosition,
  widgets: Widget[],
  gridSize: GridSize,
  widgetId?: string
): WidgetPosition | null {
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  // 목표 위치가 유효하면 그대로 반환
  if (isValidDropPosition(targetPosition, widgets, gridSize, widgetId)) {
    return targetPosition
  }
  
  // 나선형 탐색으로 가장 가까운 빈 위치 찾기
  const maxDistance = Math.max(columns, rows)
  
  for (let distance = 1; distance <= maxDistance; distance++) {
    // 상하좌우 및 대각선 방향 탐색
    const directions = [
      { dx: 0, dy: -distance }, // 위
      { dx: distance, dy: 0 },  // 오른쪽
      { dx: 0, dy: distance },   // 아래
      { dx: -distance, dy: 0 },  // 왼쪽
      { dx: distance, dy: -distance }, // 오른쪽 위
      { dx: distance, dy: distance },  // 오른쪽 아래
      { dx: -distance, dy: distance }, // 왼쪽 아래
      { dx: -distance, dy: -distance }, // 왼쪽 위
    ]
    
    for (const { dx, dy } of directions) {
      const newPosition: WidgetPosition = {
        x: targetPosition.x + dx,
        y: targetPosition.y + dy,
        width: targetPosition.width,
        height: targetPosition.height,
      }
      
      if (isValidDropPosition(newPosition, widgets, gridSize, widgetId)) {
        return newPosition
      }
    }
  }
  
  return null
}

/**
 * 위젯들을 겹치지 않게 재배치 (리플로우)
 */
export function reflowWidgets(
  widgets: Widget[],
  movedWidget: Widget,
  newPosition: WidgetPosition,
  gridSize: GridSize
): Widget[] {
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  // 이동한 위젯을 새 위치로 설정
  const updatedWidgets = widgets.map(w => 
    w.id === movedWidget.id 
      ? { ...w, position: newPosition }
      : w
  )
  
  // 충돌하는 위젯들 찾기
  const collidingWidgets = updatedWidgets.filter(w => {
    if (w.id === movedWidget.id) return false
    return checkCollision(newPosition, w.position)
  })
  
  // 충돌하는 위젯들을 아래로 이동
  collidingWidgets.forEach(widget => {
    let newY = newPosition.y + newPosition.height
    
    // 아래로 이동할 공간이 있는지 확인
    while (newY + widget.position.height <= rows) {
      const testPosition: WidgetPosition = {
        ...widget.position,
        y: newY,
      }
      
      // 다른 위젯과 충돌하지 않는지 확인
      const hasCollision = updatedWidgets.some(w => {
        if (w.id === widget.id || w.id === movedWidget.id) return false
        return checkCollision(testPosition, w.position)
      })
      
      if (!hasCollision) {
        // 충돌하지 않는 위치 찾음
        const index = updatedWidgets.findIndex(w => w.id === widget.id)
        updatedWidgets[index] = { ...widget, position: testPosition }
        break
      }
      
      newY++
    }
    
    // 아래로 이동할 수 없으면 오른쪽으로 이동 시도
    if (newY + widget.position.height > rows) {
      let newX = newPosition.x + newPosition.width
      
      while (newX + widget.position.width <= columns) {
        const testPosition: WidgetPosition = {
          ...widget.position,
          x: newX,
          y: widget.position.y,
        }
        
        const hasCollision = updatedWidgets.some(w => {
          if (w.id === widget.id || w.id === movedWidget.id) return false
          return checkCollision(testPosition, w.position)
        })
        
        if (!hasCollision) {
          const index = updatedWidgets.findIndex(w => w.id === widget.id)
          updatedWidgets[index] = { ...widget, position: testPosition }
          break
        }
        
        newX++
      }
    }
  })
  
  return updatedWidgets
}

/**
 * 그리드 좌표를 픽셀 좌표로 변환
 */
export function gridToPixel(
  gridPosition: { x: number; y: number },
  cellSize: number,
  gap: number
): { x: number; y: number } {
  return {
    x: gridPosition.x * (cellSize + gap),
    y: gridPosition.y * (cellSize + gap),
  }
}

/**
 * 픽셀 좌표를 그리드 좌표로 변환
 */
export function pixelToGrid(
  pixelPosition: { x: number; y: number },
  cellSize: number,
  gap: number
): { x: number; y: number } {
  return {
    x: Math.round(pixelPosition.x / (cellSize + gap)),
    y: Math.round(pixelPosition.y / (cellSize + gap)),
  }
}

/**
 * 드래그 가능한 영역 계산
 */
export function getDraggableArea(
  widget: Widget,
  gridSize: GridSize
): { minX: number; minY: number; maxX: number; maxY: number } {
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  return {
    minX: 0,
    minY: 0,
    maxX: columns - widget.position.width,
    maxY: rows - widget.position.height,
  }
}

/**
 * 스냅 그리드 위치 계산
 */
export function snapToGrid(
  position: { x: number; y: number },
  gridSize: GridSize
): { x: number; y: number } {
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  return {
    x: Math.max(0, Math.min(position.x, columns - 1)),
    y: Math.max(0, Math.min(position.y, rows - 1)),
  }
}