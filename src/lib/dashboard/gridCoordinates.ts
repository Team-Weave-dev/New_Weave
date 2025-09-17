import { GridSize } from '@/types/dashboard'

/**
 * 픽셀 좌표를 나타내는 타입
 */
export interface PixelCoordinates {
  x: number
  y: number
}

/**
 * 그리드 좌표를 나타내는 타입
 */
export interface GridCoordinates {
  col: number
  row: number
}

/**
 * 그리드 설정 타입
 */
export interface GridConfig {
  cellSize: number
  gap: number
  padding: number
  gridSize: GridSize
}

/**
 * 좌표 변환 결과 타입
 */
export interface CoordinateTransformResult<T> {
  coordinates: T
  isValid: boolean
  errors?: string[]
}

/**
 * 그리드 경계 타입
 */
export interface GridBounds {
  minCol: number
  maxCol: number
  minRow: number
  maxRow: number
}

/**
 * 좌표 유효성 검사
 */
export function validatePixelCoordinates(
  coords: PixelCoordinates,
  containerWidth: number,
  containerHeight: number
): boolean {
  return (
    coords.x >= 0 &&
    coords.y >= 0 &&
    coords.x <= containerWidth &&
    coords.y <= containerHeight &&
    !isNaN(coords.x) &&
    !isNaN(coords.y) &&
    isFinite(coords.x) &&
    isFinite(coords.y)
  )
}

/**
 * 그리드 좌표 유효성 검사
 */
export function validateGridCoordinates(
  coords: GridCoordinates,
  gridSize: GridSize
): boolean {
  const columns = getGridColumns(gridSize)
  const rows = columns // 정사각형 그리드
  
  return (
    coords.col >= 0 &&
    coords.row >= 0 &&
    coords.col < columns &&
    coords.row < rows &&
    Number.isInteger(coords.col) &&
    Number.isInteger(coords.row)
  )
}

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
 * 정밀한 픽셀 좌표를 그리드 좌표로 변환
 * 패딩을 고려하고 경계값 처리를 포함
 */
export function pixelToGridPrecise(
  pixel: PixelCoordinates,
  config: GridConfig
): CoordinateTransformResult<GridCoordinates> {
  const errors: string[] = []
  
  // 입력값 검증
  if (isNaN(pixel.x) || isNaN(pixel.y)) {
    errors.push('Invalid pixel coordinates: NaN detected')
    return {
      coordinates: { col: 0, row: 0 },
      isValid: false,
      errors
    }
  }
  
  if (!isFinite(pixel.x) || !isFinite(pixel.y)) {
    errors.push('Invalid pixel coordinates: Infinite value detected')
    return {
      coordinates: { col: 0, row: 0 },
      isValid: false,
      errors
    }
  }
  
  // 패딩 제거
  const adjustedX = pixel.x - config.padding
  const adjustedY = pixel.y - config.padding
  
  // 패딩 영역에 있는 경우
  if (adjustedX < 0 || adjustedY < 0) {
    return {
      coordinates: { col: 0, row: 0 },
      isValid: true,
      errors: []
    }
  }
  
  const cellWithGap = config.cellSize + config.gap
  
  // 그리드 좌표 계산 (갭 영역 고려)
  let col = Math.floor(adjustedX / cellWithGap)
  let row = Math.floor(adjustedY / cellWithGap)
  
  // 갭 영역에 있는지 확인
  const xInCell = adjustedX % cellWithGap
  const yInCell = adjustedY % cellWithGap
  
  // 갭 영역에 있으면 가장 가까운 셀로 스냅
  if (xInCell > config.cellSize) {
    col = adjustedX - (col * cellWithGap) > cellWithGap / 2 ? col + 1 : col
  }
  
  if (yInCell > config.cellSize) {
    row = adjustedY - (row * cellWithGap) > cellWithGap / 2 ? row + 1 : row
  }
  
  // 그리드 경계 제한
  const columns = getGridColumns(config.gridSize)
  col = Math.max(0, Math.min(col, columns - 1))
  row = Math.max(0, Math.min(row, columns - 1))
  
  return {
    coordinates: { col, row },
    isValid: true,
    errors: []
  }
}

/**
 * 정밀한 그리드 좌표를 픽셀 좌표로 변환
 * 셀의 왼쪽 상단 모서리 좌표 반환
 */
export function gridToPixelPrecise(
  grid: GridCoordinates,
  config: GridConfig
): CoordinateTransformResult<PixelCoordinates> {
  const errors: string[] = []
  
  // 입력값 검증
  if (!Number.isInteger(grid.col) || !Number.isInteger(grid.row)) {
    errors.push('Grid coordinates must be integers')
    return {
      coordinates: { x: 0, y: 0 },
      isValid: false,
      errors
    }
  }
  
  const columns = getGridColumns(config.gridSize)
  
  // 경계 검사
  if (grid.col < 0 || grid.row < 0 || grid.col >= columns || grid.row >= columns) {
    errors.push(`Grid coordinates out of bounds for ${config.gridSize} grid`)
    
    // 경계로 제한
    const constrainedCol = Math.max(0, Math.min(grid.col, columns - 1))
    const constrainedRow = Math.max(0, Math.min(grid.row, columns - 1))
    
    const cellWithGap = config.cellSize + config.gap
    
    return {
      coordinates: {
        x: config.padding + (constrainedCol * cellWithGap),
        y: config.padding + (constrainedRow * cellWithGap)
      },
      isValid: false,
      errors
    }
  }
  
  const cellWithGap = config.cellSize + config.gap
  
  return {
    coordinates: {
      x: config.padding + (grid.col * cellWithGap),
      y: config.padding + (grid.row * cellWithGap)
    },
    isValid: true,
    errors: []
  }
}

/**
 * 픽셀 좌표가 어느 셀의 중심에 가장 가까운지 찾기
 */
export function findNearestGridCell(
  pixel: PixelCoordinates,
  config: GridConfig
): GridCoordinates {
  const adjustedX = Math.max(0, pixel.x - config.padding)
  const adjustedY = Math.max(0, pixel.y - config.padding)
  
  const cellWithGap = config.cellSize + config.gap
  const halfCell = config.cellSize / 2
  
  // 각 셀의 중심까지의 거리를 고려
  const col = Math.round((adjustedX - halfCell) / cellWithGap)
  const row = Math.round((adjustedY - halfCell) / cellWithGap)
  
  // 그리드 경계 제한
  const columns = getGridColumns(config.gridSize)
  
  return {
    col: Math.max(0, Math.min(col, columns - 1)),
    row: Math.max(0, Math.min(row, columns - 1))
  }
}

/**
 * 그리드 좌표에서 셀의 중심 픽셀 좌표 구하기
 */
export function getGridCellCenter(
  grid: GridCoordinates,
  config: GridConfig
): PixelCoordinates {
  const cellWithGap = config.cellSize + config.gap
  const halfCell = config.cellSize / 2
  
  return {
    x: config.padding + (grid.col * cellWithGap) + halfCell,
    y: config.padding + (grid.row * cellWithGap) + halfCell
  }
}

/**
 * 픽셀 좌표가 그리드 셀 내부에 있는지 확인
 */
export function isPixelInGridCell(
  pixel: PixelCoordinates,
  grid: GridCoordinates,
  config: GridConfig
): boolean {
  const cellPixel = gridToPixelPrecise(grid, config)
  
  if (!cellPixel.isValid) return false
  
  const { x, y } = cellPixel.coordinates
  
  return (
    pixel.x >= x &&
    pixel.y >= y &&
    pixel.x <= x + config.cellSize &&
    pixel.y <= y + config.cellSize
  )
}

/**
 * 두 그리드 좌표 사이의 맨해튼 거리 계산
 */
export function gridManhattanDistance(
  from: GridCoordinates,
  to: GridCoordinates
): number {
  return Math.abs(to.col - from.col) + Math.abs(to.row - from.row)
}

/**
 * 두 그리드 좌표 사이의 유클리드 거리 계산
 */
export function gridEuclideanDistance(
  from: GridCoordinates,
  to: GridCoordinates
): number {
  const dx = to.col - from.col
  const dy = to.row - from.row
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 위젯이 차지하는 그리드 경계 구하기
 */
export function getWidgetGridBounds(
  position: GridCoordinates,
  width: number,
  height: number
): GridBounds {
  return {
    minCol: position.col,
    maxCol: position.col + width - 1,
    minRow: position.row,
    maxRow: position.row + height - 1
  }
}

/**
 * 두 그리드 영역이 겹치는지 확인
 */
export function doGridBoundsOverlap(
  bounds1: GridBounds,
  bounds2: GridBounds
): boolean {
  return !(
    bounds1.maxCol < bounds2.minCol ||
    bounds2.maxCol < bounds1.minCol ||
    bounds1.maxRow < bounds2.minRow ||
    bounds2.maxRow < bounds1.minRow
  )
}

/**
 * 드래그 시 스냅 포인트 계산
 */
export function calculateSnapPoints(
  config: GridConfig
): PixelCoordinates[] {
  const snapPoints: PixelCoordinates[] = []
  const columns = getGridColumns(config.gridSize)
  
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < columns; row++) {
      const result = gridToPixelPrecise({ col, row }, config)
      if (result.isValid) {
        snapPoints.push(result.coordinates)
      }
    }
  }
  
  return snapPoints
}

/**
 * 가장 가까운 스냅 포인트 찾기
 */
export function findNearestSnapPoint(
  pixel: PixelCoordinates,
  snapPoints: PixelCoordinates[],
  threshold: number = 20
): PixelCoordinates | null {
  let nearest: PixelCoordinates | null = null
  let minDistance = threshold
  
  for (const point of snapPoints) {
    const distance = Math.sqrt(
      Math.pow(pixel.x - point.x, 2) + 
      Math.pow(pixel.y - point.y, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      nearest = point
    }
  }
  
  return nearest
}