import { 
  pixelToGridPrecise, 
  gridToPixelPrecise,
  validatePixelCoordinates,
  validateGridCoordinates,
  findNearestGridCell,
  getGridCellCenter,
  isPixelInGridCell,
  gridManhattanDistance,
  gridEuclideanDistance,
  getWidgetGridBounds,
  doGridBoundsOverlap,
  calculateSnapPoints,
  findNearestSnapPoint,
  type GridConfig,
  type PixelCoordinates,
  type GridCoordinates
} from '../gridCoordinates'

describe('Grid Coordinate System', () => {
  const defaultConfig: GridConfig = {
    cellSize: 150,
    gap: 16,
    padding: 16,
    gridSize: '3x3'
  }

  describe('validatePixelCoordinates', () => {
    it('should validate valid pixel coordinates', () => {
      expect(validatePixelCoordinates({ x: 50, y: 50 }, 500, 500)).toBe(true)
      expect(validatePixelCoordinates({ x: 0, y: 0 }, 500, 500)).toBe(true)
      expect(validatePixelCoordinates({ x: 500, y: 500 }, 500, 500)).toBe(true)
    })

    it('should reject invalid pixel coordinates', () => {
      expect(validatePixelCoordinates({ x: -1, y: 50 }, 500, 500)).toBe(false)
      expect(validatePixelCoordinates({ x: 50, y: -1 }, 500, 500)).toBe(false)
      expect(validatePixelCoordinates({ x: 501, y: 50 }, 500, 500)).toBe(false)
      expect(validatePixelCoordinates({ x: NaN, y: 50 }, 500, 500)).toBe(false)
      expect(validatePixelCoordinates({ x: Infinity, y: 50 }, 500, 500)).toBe(false)
    })
  })

  describe('validateGridCoordinates', () => {
    it('should validate valid grid coordinates', () => {
      expect(validateGridCoordinates({ col: 0, row: 0 }, '3x3')).toBe(true)
      expect(validateGridCoordinates({ col: 1, row: 1 }, '3x3')).toBe(true)
      expect(validateGridCoordinates({ col: 2, row: 2 }, '3x3')).toBe(true)
    })

    it('should reject invalid grid coordinates', () => {
      expect(validateGridCoordinates({ col: -1, row: 0 }, '3x3')).toBe(false)
      expect(validateGridCoordinates({ col: 0, row: -1 }, '3x3')).toBe(false)
      expect(validateGridCoordinates({ col: 3, row: 0 }, '3x3')).toBe(false)
      expect(validateGridCoordinates({ col: 0, row: 3 }, '3x3')).toBe(false)
      expect(validateGridCoordinates({ col: 1.5, row: 0 }, '3x3')).toBe(false)
    })
  })

  describe('pixelToGridPrecise', () => {
    it('should convert pixel to grid coordinates correctly', () => {
      const result = pixelToGridPrecise({ x: 16, y: 16 }, defaultConfig)
      expect(result.isValid).toBe(true)
      expect(result.coordinates).toEqual({ col: 0, row: 0 })
    })

    it('should handle padding correctly', () => {
      // 패딩 내부
      const result1 = pixelToGridPrecise({ x: 10, y: 10 }, defaultConfig)
      expect(result1.coordinates).toEqual({ col: 0, row: 0 })
      
      // 첫 번째 셀
      const result2 = pixelToGridPrecise({ x: 16, y: 16 }, defaultConfig)
      expect(result2.coordinates).toEqual({ col: 0, row: 0 })
      
      // 두 번째 셀 (150 + 16 gap + 16 padding = 182)
      const result3 = pixelToGridPrecise({ x: 182, y: 16 }, defaultConfig)
      expect(result3.coordinates).toEqual({ col: 1, row: 0 })
    })

    it('should handle gap areas by snapping to nearest cell', () => {
      // 갭 영역에서 가장 가까운 셀로 스냅
      const cellEnd = 16 + 150 // padding + cellSize = 166
      const gapMiddle = cellEnd + 8 // 갭의 중간
      
      const result = pixelToGridPrecise({ x: gapMiddle, y: 16 }, defaultConfig)
      expect(result.isValid).toBe(true)
    })

    it('should handle invalid input gracefully', () => {
      const result1 = pixelToGridPrecise({ x: NaN, y: 50 }, defaultConfig)
      expect(result1.isValid).toBe(false)
      expect(result1.errors).toContain('Invalid pixel coordinates: NaN detected')
      
      const result2 = pixelToGridPrecise({ x: Infinity, y: 50 }, defaultConfig)
      expect(result2.isValid).toBe(false)
      expect(result2.errors).toContain('Invalid pixel coordinates: Infinite value detected')
    })
  })

  describe('gridToPixelPrecise', () => {
    it('should convert grid to pixel coordinates correctly', () => {
      const result = gridToPixelPrecise({ col: 0, row: 0 }, defaultConfig)
      expect(result.isValid).toBe(true)
      expect(result.coordinates).toEqual({ x: 16, y: 16 })
    })

    it('should calculate correct pixel positions for different cells', () => {
      // 첫 번째 셀
      const result1 = gridToPixelPrecise({ col: 0, row: 0 }, defaultConfig)
      expect(result1.coordinates).toEqual({ x: 16, y: 16 })
      
      // 두 번째 열
      const result2 = gridToPixelPrecise({ col: 1, row: 0 }, defaultConfig)
      expect(result2.coordinates).toEqual({ x: 182, y: 16 }) // 16 + 150 + 16
      
      // 두 번째 행
      const result3 = gridToPixelPrecise({ col: 0, row: 1 }, defaultConfig)
      expect(result3.coordinates).toEqual({ x: 16, y: 182 })
    })

    it('should handle out of bounds coordinates', () => {
      const result = gridToPixelPrecise({ col: 5, row: 5 }, defaultConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Grid coordinates out of bounds for 3x3 grid')
    })

    it('should reject non-integer coordinates', () => {
      const result = gridToPixelPrecise({ col: 1.5, row: 0 }, defaultConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Grid coordinates must be integers')
    })
  })

  describe('findNearestGridCell', () => {
    it('should find the nearest grid cell', () => {
      // 셀 중앙 근처
      const result1 = findNearestGridCell({ x: 90, y: 90 }, defaultConfig)
      expect(result1).toEqual({ col: 0, row: 0 })
      
      // 두 번째 셀 근처
      const result2 = findNearestGridCell({ x: 250, y: 90 }, defaultConfig)
      expect(result2).toEqual({ col: 1, row: 0 })
    })
  })

  describe('getGridCellCenter', () => {
    it('should return the center of a grid cell', () => {
      const center = getGridCellCenter({ col: 0, row: 0 }, defaultConfig)
      expect(center).toEqual({ x: 91, y: 91 }) // 16 + 75
      
      const center2 = getGridCellCenter({ col: 1, row: 1 }, defaultConfig)
      expect(center2).toEqual({ x: 257, y: 257 }) // 182 + 75
    })
  })

  describe('isPixelInGridCell', () => {
    it('should check if pixel is inside grid cell', () => {
      // 첫 번째 셀 내부
      expect(isPixelInGridCell({ x: 20, y: 20 }, { col: 0, row: 0 }, defaultConfig)).toBe(true)
      expect(isPixelInGridCell({ x: 165, y: 165 }, { col: 0, row: 0 }, defaultConfig)).toBe(true)
      
      // 첫 번째 셀 외부
      expect(isPixelInGridCell({ x: 200, y: 20 }, { col: 0, row: 0 }, defaultConfig)).toBe(false)
      expect(isPixelInGridCell({ x: 20, y: 200 }, { col: 0, row: 0 }, defaultConfig)).toBe(false)
    })
  })

  describe('gridManhattanDistance', () => {
    it('should calculate Manhattan distance', () => {
      expect(gridManhattanDistance({ col: 0, row: 0 }, { col: 0, row: 0 })).toBe(0)
      expect(gridManhattanDistance({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(1)
      expect(gridManhattanDistance({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(2)
      expect(gridManhattanDistance({ col: 0, row: 0 }, { col: 2, row: 2 })).toBe(4)
    })
  })

  describe('gridEuclideanDistance', () => {
    it('should calculate Euclidean distance', () => {
      expect(gridEuclideanDistance({ col: 0, row: 0 }, { col: 0, row: 0 })).toBe(0)
      expect(gridEuclideanDistance({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(1)
      expect(gridEuclideanDistance({ col: 0, row: 0 }, { col: 1, row: 1 })).toBeCloseTo(1.414, 2)
      expect(gridEuclideanDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(5)
    })
  })

  describe('getWidgetGridBounds', () => {
    it('should return correct widget bounds', () => {
      const bounds = getWidgetGridBounds({ col: 1, row: 1 }, 2, 2)
      expect(bounds).toEqual({
        minCol: 1,
        maxCol: 2,
        minRow: 1,
        maxRow: 2
      })
    })
  })

  describe('doGridBoundsOverlap', () => {
    it('should detect overlapping bounds', () => {
      const bounds1 = { minCol: 0, maxCol: 1, minRow: 0, maxRow: 1 }
      const bounds2 = { minCol: 1, maxCol: 2, minRow: 1, maxRow: 2 }
      const bounds3 = { minCol: 2, maxCol: 3, minRow: 2, maxRow: 3 }
      
      expect(doGridBoundsOverlap(bounds1, bounds2)).toBe(true)
      expect(doGridBoundsOverlap(bounds1, bounds3)).toBe(false)
    })
  })

  describe('calculateSnapPoints', () => {
    it('should generate all snap points for the grid', () => {
      const config: GridConfig = {
        ...defaultConfig,
        gridSize: '2x2'
      }
      
      const snapPoints = calculateSnapPoints(config)
      expect(snapPoints).toHaveLength(4) // 2x2 grid
      expect(snapPoints[0]).toEqual({ x: 16, y: 16 })
      expect(snapPoints[1]).toEqual({ x: 16, y: 182 })
      expect(snapPoints[2]).toEqual({ x: 182, y: 16 })
      expect(snapPoints[3]).toEqual({ x: 182, y: 182 })
    })
  })

  describe('findNearestSnapPoint', () => {
    it('should find nearest snap point within threshold', () => {
      const snapPoints: PixelCoordinates[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 }
      ]
      
      expect(findNearestSnapPoint({ x: 10, y: 10 }, snapPoints, 20)).toEqual({ x: 0, y: 0 })
      expect(findNearestSnapPoint({ x: 95, y: 95 }, snapPoints, 20)).toEqual({ x: 100, y: 100 })
      expect(findNearestSnapPoint({ x: 50, y: 50 }, snapPoints, 20)).toBeNull()
    })
  })

  describe('Round-trip conversion', () => {
    it('should maintain consistency in round-trip conversions', () => {
      const originalGrid: GridCoordinates = { col: 1, row: 2 }
      
      // Grid -> Pixel
      const pixelResult = gridToPixelPrecise(originalGrid, defaultConfig)
      expect(pixelResult.isValid).toBe(true)
      
      // Pixel -> Grid
      const gridResult = pixelToGridPrecise(pixelResult.coordinates, defaultConfig)
      expect(gridResult.isValid).toBe(true)
      expect(gridResult.coordinates).toEqual(originalGrid)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero-sized grid', () => {
      const config: GridConfig = {
        cellSize: 0,
        gap: 0,
        padding: 0,
        gridSize: '3x3'
      }
      
      const result = pixelToGridPrecise({ x: 100, y: 100 }, config)
      expect(result.isValid).toBe(true)
    })

    it('should handle large coordinates', () => {
      const largeCoord = { x: 10000, y: 10000 }
      const result = pixelToGridPrecise(largeCoord, defaultConfig)
      expect(result.isValid).toBe(true)
      expect(result.coordinates.col).toBeLessThanOrEqual(2) // 3x3 grid max
      expect(result.coordinates.row).toBeLessThanOrEqual(2)
    })

    it('should handle negative coordinates by clamping to 0', () => {
      const result = pixelToGridPrecise({ x: -100, y: -100 }, defaultConfig)
      expect(result.isValid).toBe(true)
      expect(result.coordinates).toEqual({ col: 0, row: 0 })
    })
  })
})