import { GridSize } from '@/types/dashboard'

/**
 * 그리드 크기에 따른 컬럼 수 반환
 */
export function getGridColumns(gridSize: GridSize): number {
  const sizeMap: Record<GridSize, number> = {
    '2x2': 2,
    '3x3': 3,
    '4x4': 4,
    '5x5': 5,
  }
  return sizeMap[gridSize] || 3
}

/**
 * 컨테이너 크기와 그리드 설정을 기반으로 셀 크기 계산
 */
export function calculateCellSize(
  containerWidth: number,
  gridSize: GridSize,
  gap: number = 16,
  padding: number = 16
): number {
  const columns = getGridColumns(gridSize)
  
  // 패딩과 갭을 제외한 실제 사용 가능한 너비
  const availableWidth = containerWidth - (padding * 2) - (gap * (columns - 1))
  
  // 각 셀의 크기 계산
  const cellSize = Math.floor(availableWidth / columns)
  
  // 최소 크기 보장 (모바일 환경 고려)
  const minCellSize = 100
  
  return Math.max(cellSize, minCellSize)
}

/**
 * 픽셀 좌표를 그리드 좌표로 변환
 */
export function pixelToGrid(
  pixelX: number,
  pixelY: number,
  cellSize: number,
  gap: number = 16
): { col: number; row: number } {
  const cellWithGap = cellSize + gap
  
  const col = Math.floor(pixelX / cellWithGap)
  const row = Math.floor(pixelY / cellWithGap)
  
  return {
    col: Math.max(0, col),
    row: Math.max(0, row)
  }
}

/**
 * 그리드 좌표를 픽셀 좌표로 변환
 */
export function gridToPixel(
  col: number,
  row: number,
  cellSize: number,
  gap: number = 16,
  padding: number = 16
): { x: number; y: number } {
  const cellWithGap = cellSize + gap
  
  return {
    x: padding + (col * cellWithGap),
    y: padding + (row * cellWithGap)
  }
}

/**
 * 드래그 델타값을 그리드 단위로 변환
 */
export function deltaToGridUnits(
  deltaX: number,
  deltaY: number,
  cellSize: number,
  gap: number = 16
): { gridDeltaX: number; gridDeltaY: number } {
  const cellWithGap = cellSize + gap
  
  return {
    gridDeltaX: Math.round(deltaX / cellWithGap),
    gridDeltaY: Math.round(deltaY / cellWithGap)
  }
}

/**
 * 그리드 경계 내 유효한 위치로 제한
 */
export function constrainToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  gridColumns: number
): { x: number; y: number } {
  const maxX = Math.max(0, gridColumns - width)
  const maxY = Math.max(0, gridColumns - height)
  
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY))
  }
}

/**
 * 위젯의 픽셀 크기 계산
 */
export function calculateWidgetSize(
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  gap: number = 16
): { width: number; height: number } {
  return {
    width: (gridWidth * cellSize) + ((gridWidth - 1) * gap),
    height: (gridHeight * cellSize) + ((gridHeight - 1) * gap)
  }
}