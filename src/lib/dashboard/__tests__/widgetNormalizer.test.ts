import { WidgetNormalizer } from '../widgetNormalizer'
import { Widget, GridSize } from '@/types/dashboard'

describe('WidgetNormalizer', () => {
  let normalizer: WidgetNormalizer

  beforeEach(() => {
    normalizer = new WidgetNormalizer('3x3')
  })

  describe('validatePosition', () => {
    it('유효한 위치를 검증해야 함', () => {
      const result = normalizer.validatePosition({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('음수 좌표를 감지해야 함', () => {
      const result = normalizer.validatePosition({
        x: -1,
        y: -1,
        width: 1,
        height: 1,
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('X 좌표는 0 이상이어야 합니다 (현재값: -1)')
      expect(result.errors).toContain('Y 좌표는 0 이상이어야 합니다 (현재값: -1)')
    })

    it('그리드 범위 초과를 감지해야 함', () => {
      const result = normalizer.validatePosition({
        x: 2,
        y: 2,
        width: 2,
        height: 2,
      })
      
      expect(result.isValid).toBe(true) // 오류는 아니지만 경고
      expect(result.warnings).toContain('위젯이 그리드 너비를 1 만큼 초과합니다')
      expect(result.warnings).toContain('위젯이 그리드 높이를 1 만큼 초과합니다')
    })

    it('소수점 값에 대한 경고를 생성해야 함', () => {
      const result = normalizer.validatePosition({
        x: 1.5,
        y: 0.5,
        width: 1.2,
        height: 1.8,
      })
      
      expect(result.warnings).toContain('좌표에 소수점이 포함되어 있습니다')
      expect(result.warnings).toContain('크기에 소수점이 포함되어 있습니다')
    })

    it('NaN과 undefined를 감지해야 함', () => {
      const result = normalizer.validatePosition({
        x: NaN,
        y: undefined as any,
        width: 1,
        height: 1,
      })
      
      expect(result.isValid).toBe(false)
      expect(result.severity).toBe('critical')
    })
  })

  describe('normalizePosition', () => {
    it('음수 값을 0으로 보정해야 함', () => {
      const result = normalizer.normalizePosition({
        x: -1,
        y: -2,
        width: -1,
        height: -1,
      })
      
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
      expect(result.width).toBe(1)
      expect(result.height).toBe(1)
    })

    it('소수점 값을 반올림해야 함', () => {
      const result = normalizer.normalizePosition({
        x: 1.4,
        y: 1.6,
        width: 2.3,
        height: 2.7,
      })
      
      expect(result.x).toBe(1)
      expect(result.y).toBe(2)
      expect(result.width).toBe(2)
      expect(result.height).toBe(3)
    })

    it('그리드 범위를 초과하는 값을 조정해야 함', () => {
      const result = normalizer.normalizePosition({
        x: 5,
        y: 5,
        width: 3,
        height: 3,
      })
      
      expect(result.x).toBe(2) // 3x3 그리드에서 최대 2
      expect(result.y).toBe(2)
      expect(result.width).toBe(1) // 그리드를 벗어나지 않도록 조정
      expect(result.height).toBe(1)
    })

    it('NaN을 기본값으로 처리해야 함', () => {
      const result = normalizer.normalizePosition({
        x: NaN,
        y: NaN,
        width: NaN,
        height: NaN,
      })
      
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
      expect(result.width).toBe(1)
      expect(result.height).toBe(1)
    })
  })

  describe('detectDuplicates', () => {
    it('중복 위치를 감지해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 0, y: 0, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } },
      ]
      
      const duplicates = normalizer.detectDuplicates(widgets)
      
      expect(duplicates.size).toBe(1)
      expect(duplicates.get('0,0,1,1')).toEqual(['w1', 'w2'])
    })

    it('중복이 없을 때 빈 맵을 반환해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 0, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 0, y: 1, width: 1, height: 1 } },
      ]
      
      const duplicates = normalizer.detectDuplicates(widgets)
      
      expect(duplicates.size).toBe(0)
    })
  })

  describe('detectCollisions', () => {
    it('겹치는 위젯을 감지해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 2, height: 2 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 2, height: 2 } },
        { id: 'w3', type: 'test', position: { x: 2, y: 2, width: 1, height: 1 } },
      ]
      
      const collisions = normalizer.detectCollisions(widgets)
      
      expect(collisions).toHaveLength(2)
      expect(collisions[0]).toEqual({ widget1: 'w1', widget2: 'w2' })
      expect(collisions[1]).toEqual({ widget1: 'w2', widget2: 'w3' })
    })

    it('겹치지 않는 위젯은 충돌로 감지하지 않아야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 0, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 0, y: 1, width: 1, height: 1 } },
      ]
      
      const collisions = normalizer.detectCollisions(widgets)
      
      expect(collisions).toHaveLength(0)
    })
  })

  describe('autoAlign', () => {
    it('위젯을 자동으로 정렬해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 2, height: 2 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } }, // 충돌
        { id: 'w3', type: 'test', position: { x: 0, y: 2, width: 1, height: 1 } },
      ]
      
      const aligned = normalizer.autoAlign(widgets)
      
      // w2가 재배치되어야 함
      expect(aligned[1].position.x).not.toBe(1)
      expect(aligned[1].position.y).not.toBe(1)
      
      // 충돌이 없어야 함
      const collisions = normalizer.detectCollisions(aligned)
      expect(collisions).toHaveLength(0)
    })

    it('잠긴 위젯은 이동하지 않아야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 2, height: 2 }, locked: true },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } }, // 충돌
      ]
      
      const aligned = normalizer.autoAlign(widgets)
      
      // 잠긴 위젯은 위치 유지
      expect(aligned[0].position).toEqual({ x: 0, y: 0, width: 2, height: 2 })
      
      // w2는 재배치됨
      expect(aligned[1].position.x).toBe(2)
      expect(aligned[1].position.y).toBe(0)
    })

    it('compact 모드에 따라 정렬해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 2, y: 2, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 0, y: 2, width: 1, height: 1 } },
      ]
      
      const aligned = normalizer.autoAlign(widgets, { compactMode: 'vertical' })
      
      // vertical compact: 왼쪽 위부터 채워짐
      expect(aligned.some(w => w.position.x === 0 && w.position.y === 0)).toBe(true)
    })
  })

  describe('normalizeWidgets', () => {
    it('전체 정규화 프로세스를 실행해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: -1, y: -1, width: 2, height: 2 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } }, // 중복
      ]
      
      const result = normalizer.normalizeWidgets(widgets)
      
      expect(result.report.totalWidgets).toBe(3)
      expect(result.report.invalidPositions).toBeGreaterThan(0)
      expect(result.report.duplicates).toBe(1)
      expect(result.report.normalized).toBe(true)
      expect(result.report.changes.length).toBeGreaterThan(0)
      
      // 결과에 충돌이 없어야 함
      const collisions = normalizer.detectCollisions(result.widgets)
      expect(collisions).toHaveLength(0)
    })

    it('autoFix 옵션을 존중해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 2, height: 2 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } }, // 충돌
      ]
      
      const result = normalizer.normalizeWidgets(widgets, { autoFix: false })
      
      // autoFix가 false면 충돌이 그대로 유지됨
      const collisions = normalizer.detectCollisions(result.widgets)
      expect(collisions).toHaveLength(1)
    })
  })

  describe('migrateWidgets', () => {
    it('그리드 크기 변경 시 위치를 스케일링해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 2, y: 2, width: 1, height: 1 } },
      ]
      
      const migrated = normalizer.migrateWidgets(widgets, '3x3', '5x5')
      
      // 3x3 -> 5x5: 1.67배 스케일
      expect(migrated[0].position.x).toBe(2) // round(1 * 1.67)
      expect(migrated[0].position.y).toBe(2)
      expect(migrated[1].position.x).toBe(3) // round(2 * 1.67)
      expect(migrated[1].position.y).toBe(3)
    })

    it('그리드 축소 시 오버플로우를 방지해야 함', () => {
      const normalizer5x5 = new WidgetNormalizer('5x5')
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 4, y: 4, width: 1, height: 1 } },
      ]
      
      const migrated = normalizer5x5.migrateWidgets(widgets, '5x5', '3x3')
      
      // 5x5 -> 3x3: 0.6배 스케일
      expect(migrated[0].position.x).toBeLessThanOrEqual(2)
      expect(migrated[0].position.y).toBeLessThanOrEqual(2)
    })
  })

  describe('generateLayoutReport', () => {
    it('레이아웃 상태를 분석해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: 0, y: 0, width: 1, height: 1 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 0, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 2, y: 0, width: 1, height: 1 } },
      ]
      
      const report = normalizer.generateLayoutReport(widgets)
      
      expect(report.isHealthy).toBe(true)
      expect(report.score).toBeGreaterThan(70)
      expect(report.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'info',
            message: expect.stringContaining('그리드 활용률'),
          }),
        ])
      )
    })

    it('문제가 있는 레이아웃을 감지해야 함', () => {
      const widgets: Widget[] = [
        { id: 'w1', type: 'test', position: { x: -1, y: -1, width: 2, height: 2 } },
        { id: 'w2', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } },
        { id: 'w3', type: 'test', position: { x: 1, y: 1, width: 1, height: 1 } }, // 중복
      ]
      
      const report = normalizer.generateLayoutReport(widgets)
      
      expect(report.isHealthy).toBe(false)
      expect(report.score).toBeLessThan(70)
      expect(report.issues.some(i => i.type === 'error')).toBe(true)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('그리드 크기별 동작', () => {
    it.each<GridSize>(['2x2', '3x3', '4x4', '5x5'])(
      '%s 그리드에서 올바르게 동작해야 함',
      (gridSize) => {
        const normalizer = new WidgetNormalizer(gridSize)
        const gridNum = parseInt(gridSize[0])
        
        const position = normalizer.normalizePosition({
          x: gridNum + 1,
          y: gridNum + 1,
          width: 2,
          height: 2,
        })
        
        expect(position.x).toBeLessThanOrEqual(gridNum - 1)
        expect(position.y).toBeLessThanOrEqual(gridNum - 1)
        expect(position.width).toBeGreaterThan(0)
        expect(position.height).toBeGreaterThan(0)
      }
    )
  })
})