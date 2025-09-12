import {
  CollisionDetection,
  ClientRect,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { 
  checkCollision, 
  getGridColumns,
  pixelToGrid,
  gridToPixel,
} from '@/lib/dashboard/collisionDetection'
import { Widget, GridSize } from '@/types/dashboard'

interface CollisionContext {
  widgets: Widget[]
  gridSize: GridSize
  cellSize: number
  gap: number
}

/**
 * 그리드 기반 충돌 감지 전략
 * 위젯의 실제 그리드 위치를 고려하여 충돌을 감지
 */
export function createGridCollisionDetection(
  context: CollisionContext
): CollisionDetection {
  return (args) => {
    const { 
      active, 
      collisionRect, 
      droppableRects, 
      droppableContainers,
      pointerCoordinates,
    } = args
    
    if (!active || !collisionRect) {
      return []
    }
    
    const activeWidget = context.widgets.find(w => w.id === active.id)
    if (!activeWidget) {
      return []
    }
    
    // 포인터 위치를 그리드 좌표로 변환
    if (pointerCoordinates) {
      const gridPos = pixelToGrid(
        { x: pointerCoordinates.x, y: pointerCoordinates.y },
        context.cellSize,
        context.gap
      )
      
      // 해당 그리드 위치에 있는 위젯 찾기
      const targetWidget = context.widgets.find(w => {
        if (w.id === active.id || w.locked) return false
        
        return (
          gridPos.x >= w.position.x &&
          gridPos.x < w.position.x + w.position.width &&
          gridPos.y >= w.position.y &&
          gridPos.y < w.position.y + w.position.height
        )
      })
      
      if (targetWidget) {
        const droppableRect = droppableRects.get(targetWidget.id)
        if (droppableRect) {
          return [{
            id: targetWidget.id,
            data: {
              droppableContainer: droppableContainers.find((c: any) => c.id === targetWidget.id),
              value: calculateCollisionScore(collisionRect, droppableRect),
            },
          }]
        }
      }
    }
    
    // 폴백: 가장 가까운 드롭 가능한 위치 찾기
    const collisions: ReturnType<CollisionDetection> = []
    
    for (const [id, rect] of droppableRects) {
      if (id === active.id) continue
      
      const widget = context.widgets.find(w => w.id === id)
      if (widget?.locked) continue
      
      const score = calculateCollisionScore(collisionRect, rect)
      if (score > 0) {
        collisions.push({
          id,
          data: {
            droppableContainer: droppableContainers.find((c: any) => c.id === id),
            value: score,
          },
        })
      }
    }
    
    // 점수순으로 정렬
    return collisions.sort((a, b) => b.data.value - a.data.value)
  }
}

/**
 * 두 사각형 간의 충돌 점수 계산
 * 겹치는 영역이 클수록 높은 점수
 */
function calculateCollisionScore(rect1: ClientRect, rect2: ClientRect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
  )
  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
  )
  
  const overlapArea = xOverlap * yOverlap
  const rect1Area = rect1.width * rect1.height
  const rect2Area = rect2.width * rect2.height
  const minArea = Math.min(rect1Area, rect2Area)
  
  // 겹치는 영역의 비율을 점수로 사용
  return minArea > 0 ? (overlapArea / minArea) * 100 : 0
}

/**
 * 드롭 가능한 빈 공간 찾기
 */
export function findDroppableEmptySpace(
  activeWidget: Widget,
  widgets: Widget[],
  gridSize: GridSize,
  pointerPosition: { x: number; y: number },
  cellSize: number,
  gap: number
): { x: number; y: number } | null {
  const gridPos = pixelToGrid(pointerPosition, cellSize, gap)
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  // 포인터 위치부터 시작하여 가장 가까운 빈 공간 찾기
  for (let distance = 0; distance < Math.max(columns, rows); distance++) {
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        // 거리가 일치하는 위치만 확인
        if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue
        
        const testX = gridPos.x + dx
        const testY = gridPos.y + dy
        
        // 경계 체크
        if (
          testX < 0 || testY < 0 ||
          testX + activeWidget.position.width > columns ||
          testY + activeWidget.position.height > rows
        ) {
          continue
        }
        
        // 충돌 체크
        const hasCollision = widgets.some(w => {
          if (w.id === activeWidget.id) return false
          return checkCollision(
            { ...activeWidget.position, x: testX, y: testY },
            w.position
          )
        })
        
        if (!hasCollision) {
          return { x: testX, y: testY }
        }
      }
    }
  }
  
  return null
}

/**
 * 드래그 중 프리뷰 위치 계산
 */
export function calculatePreviewPosition(
  activeWidget: Widget,
  widgets: Widget[],
  gridSize: GridSize,
  delta: { x: number; y: number },
  cellSize: number,
  gap: number
): { x: number; y: number; isValid: boolean } {
  // 현재 위치 + 델타를 그리드 좌표로 변환
  const currentPixel = gridToPixel(
    { x: activeWidget.position.x, y: activeWidget.position.y },
    cellSize,
    gap
  )
  
  const newPixel = {
    x: currentPixel.x + delta.x,
    y: currentPixel.y + delta.y,
  }
  
  const newGrid = pixelToGrid(newPixel, cellSize, gap)
  const columns = getGridColumns(gridSize)
  const rows = columns
  
  // 경계 제한
  const clampedPosition = {
    x: Math.max(0, Math.min(newGrid.x, columns - activeWidget.position.width)),
    y: Math.max(0, Math.min(newGrid.y, rows - activeWidget.position.height)),
  }
  
  // 충돌 확인
  const hasCollision = widgets.some(w => {
    if (w.id === activeWidget.id) return false
    return checkCollision(
      { ...activeWidget.position, ...clampedPosition },
      w.position
    )
  })
  
  return {
    ...clampedPosition,
    isValid: !hasCollision,
  }
}