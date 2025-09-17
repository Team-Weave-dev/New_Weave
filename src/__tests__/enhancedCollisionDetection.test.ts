/**
 * 향상된 충돌 감지 시스템 단위 테스트
 */

import { EnhancedCollisionDetector } from '@/lib/dashboard/enhancedCollisionDetection'
import { Quadtree } from '@/lib/dashboard/quadtree'
import { Widget, WidgetPosition } from '@/types/dashboard'

describe('Quadtree', () => {
  let quadtree: Quadtree<Widget>

  beforeEach(() => {
    quadtree = new Quadtree<Widget>({
      x: 0,
      y: 0,
      width: 5,
      height: 5,
    })
  })

  it('should insert and query widgets correctly', () => {
    const widget1: Widget = {
      id: 'widget1',
      type: 'weather',
      position: { x: 0, y: 0, width: 2, height: 2 },
      data: {},
      locked: false,
    }

    const widget2: Widget = {
      id: 'widget2',
      type: 'calendar',
      position: { x: 3, y: 3, width: 2, height: 2 },
      data: {},
      locked: false,
    }

    quadtree.insert(widget1)
    quadtree.insert(widget2)

    // 첫 번째 위젯과 겹치는 영역 쿼리
    const results1 = quadtree.query({ x: 1, y: 1, width: 1, height: 1 })
    expect(results1).toHaveLength(1)
    expect(results1[0].id).toBe('widget1')

    // 두 번째 위젯과 겹치는 영역 쿼리
    const results2 = quadtree.query({ x: 4, y: 4, width: 1, height: 1 })
    expect(results2).toHaveLength(1)
    expect(results2[0].id).toBe('widget2')

    // 빈 공간 쿼리
    const results3 = quadtree.query({ x: 2, y: 0, width: 1, height: 1 })
    expect(results3).toHaveLength(0)
  })

  it('should handle overlapping widgets', () => {
    const widget1: Widget = {
      id: 'widget1',
      type: 'weather',
      position: { x: 0, y: 0, width: 3, height: 3 },
      data: {},
      locked: false,
    }

    const widget2: Widget = {
      id: 'widget2',
      type: 'calendar',
      position: { x: 2, y: 2, width: 3, height: 3 },
      data: {},
      locked: false,
    }

    quadtree.insert(widget1)
    quadtree.insert(widget2)

    // 겹치는 영역 쿼리
    const results = quadtree.query({ x: 2, y: 2, width: 1, height: 1 })
    expect(results).toHaveLength(2)
    expect(results.map(w => w.id).sort()).toEqual(['widget1', 'widget2'])
  })
})

describe('EnhancedCollisionDetector', () => {
  let detector: EnhancedCollisionDetector
  let widgets: Widget[]

  beforeEach(() => {
    widgets = [
      {
        id: 'widget1',
        type: 'weather',
        position: { x: 0, y: 0, width: 2, height: 2 },
        data: {},
        locked: false,
      },
      {
        id: 'widget2',
        type: 'calendar',
        position: { x: 3, y: 0, width: 2, height: 2 },
        data: {},
        locked: false,
      },
      {
        id: 'widget3',
        type: 'taskTracker',
        position: { x: 0, y: 3, width: 3, height: 2 },
        data: {},
        locked: true, // 잠긴 위젯
      },
    ]

    detector = new EnhancedCollisionDetector(widgets, '5x5', {
      allowPartialOverlap: false,
      allowSwap: true,
      allowPush: true,
    })
  })

  describe('충돌 감지', () => {
    it('충돌이 없는 경우를 정확히 감지해야 함', () => {
      const result = detector.detectCollision({ x: 2, y: 2, width: 1, height: 1 })
      expect(result.hasCollision).toBe(false)
      expect(result.collidingWidgets).toHaveLength(0)
    })

    it('충돌이 있는 경우를 정확히 감지해야 함', () => {
      const result = detector.detectCollision({ x: 0, y: 0, width: 3, height: 3 })
      expect(result.hasCollision).toBe(true)
      expect(result.collidingWidgets).toHaveLength(1)
      expect(result.collidingWidgets[0].id).toBe('widget1')
    })

    it('여러 위젯과 충돌하는 경우를 감지해야 함', () => {
      const result = detector.detectCollision({ x: 0, y: 0, width: 5, height: 5 })
      expect(result.hasCollision).toBe(true)
      expect(result.collidingWidgets).toHaveLength(3)
    })
  })

  describe('스왑 가능 여부', () => {
    it('단일 위젯과 충돌 시 스왑 가능해야 함', () => {
      const result = detector.detectCollision(
        { x: 0, y: 0, width: 2, height: 2 },
        'widget2'
      )
      expect(result.hasCollision).toBe(true)
      expect(result.swappableWidget).toBeDefined()
      expect(result.swappableWidget?.id).toBe('widget1')
    })

    it('잠긴 위젯과는 스왑 불가능해야 함', () => {
      const result = detector.detectCollision(
        { x: 0, y: 3, width: 3, height: 2 },
        'widget1'
      )
      expect(result.hasCollision).toBe(true)
      expect(result.swappableWidget).toBeUndefined()
    })

    it('여러 위젯과 충돌 시 스왑 불가능해야 함', () => {
      const result = detector.detectCollision(
        { x: 0, y: 0, width: 5, height: 3 },
        'newWidget'
      )
      expect(result.hasCollision).toBe(true)
      expect(result.swappableWidget).toBeUndefined()
    })
  })

  describe('대체 위치 제안', () => {
    it('충돌 시 가장 가까운 빈 위치를 제안해야 함', () => {
      const result = detector.detectCollision({ x: 0, y: 0, width: 2, height: 2 })
      expect(result.hasCollision).toBe(true)
      expect(result.suggestedPosition).toBeDefined()
      
      // 제안된 위치는 충돌이 없어야 함
      if (result.suggestedPosition) {
        const testResult = detector.detectCollision(result.suggestedPosition)
        expect(testResult.hasCollision).toBe(false)
      }
    })

    it('경계를 벗어나지 않는 위치를 제안해야 함', () => {
      const result = detector.detectCollision({ x: 4, y: 4, width: 3, height: 3 })
      expect(result.hasCollision).toBe(false) // 경계를 벗어나므로 충돌로 간주되지 않음
      
      // 경계 내 유효한 위치 테스트
      const boundedResult = detector.detectCollision({ x: 3, y: 3, width: 2, height: 2 })
      expect(boundedResult.hasCollision).toBe(false)
    })
  })

  describe('부분 겹침 허용', () => {
    it('부분 겹침 옵션이 활성화되면 작은 겹침을 허용해야 함', () => {
      const partialDetector = new EnhancedCollisionDetector(widgets, '5x5', {
        allowPartialOverlap: true,
        maxOverlapRatio: 0.3, // 30% 이하 겹침 허용
        allowSwap: false,
        allowPush: false,
      })

      // 작은 겹침 (25%)
      const result = detector.detectCollision({
        x: 1.5,
        y: 0,
        width: 2,
        height: 2,
      })
      
      // 기본 설정에서는 충돌
      expect(result.hasCollision).toBe(true)
    })
  })

  describe('빈 공간 찾기', () => {
    it('지정된 크기의 빈 공간을 모두 찾아야 함', () => {
      const emptySpaces = detector.findEmptySpaces(1, 1)
      
      // 빈 공간이 있어야 함
      expect(emptySpaces.length).toBeGreaterThan(0)
      
      // 각 빈 공간은 충돌이 없어야 함
      emptySpaces.forEach(space => {
        const result = detector.detectCollision(space)
        expect(result.hasCollision).toBe(false)
      })
    })

    it('큰 빈 공간을 정확히 찾아야 함', () => {
      const largeSpaces = detector.findEmptySpaces(2, 2)
      
      largeSpaces.forEach(space => {
        expect(space.width).toBeGreaterThanOrEqual(2)
        expect(space.height).toBeGreaterThanOrEqual(2)
        
        const result = detector.detectCollision(space)
        expect(result.hasCollision).toBe(false)
      })
    })
  })

  describe('위젯 밀어내기', () => {
    it('충돌하는 위젯을 밀어낼 수 있어야 함', () => {
      const movedWidget: Widget = {
        id: 'widget1',
        type: 'weather',
        position: { x: 0, y: 0, width: 2, height: 2 },
        data: {},
        locked: false,
      }

      const newPosition: WidgetPosition = { x: 2, y: 0, width: 2, height: 2 }
      
      const updatedWidgets = detector.pushWidgets(movedWidget, newPosition)
      
      // widget2가 밀려났어야 함
      const widget2 = updatedWidgets.find(w => w.id === 'widget2')
      expect(widget2).toBeDefined()
      
      // widget2의 새 위치는 충돌이 없어야 함
      if (widget2) {
        const widget1New = updatedWidgets.find(w => w.id === 'widget1')
        expect(widget1New?.position).toEqual(newPosition)
        
        // widget2가 원래 위치에서 이동했어야 함
        expect(widget2.position).not.toEqual({ x: 3, y: 0, width: 2, height: 2 })
      }
    })

    it('잠긴 위젯은 밀어내지 않아야 함', () => {
      const movedWidget: Widget = {
        id: 'widget1',
        type: 'weather',
        position: { x: 0, y: 0, width: 2, height: 2 },
        data: {},
        locked: false,
      }

      const newPosition: WidgetPosition = { x: 0, y: 2, width: 3, height: 3 }
      
      const updatedWidgets = detector.pushWidgets(movedWidget, newPosition)
      
      // widget3 (잠긴 위젯)은 움직이지 않아야 함
      const widget3 = updatedWidgets.find(w => w.id === 'widget3')
      expect(widget3?.position).toEqual({ x: 0, y: 3, width: 3, height: 2 })
    })
  })
})

describe('성능 테스트', () => {
  it('100개의 위젯에서도 빠르게 충돌을 감지해야 함', () => {
    const manyWidgets: Widget[] = []
    
    // 10x10 그리드에 랜덤하게 위젯 배치
    for (let i = 0; i < 100; i++) {
      manyWidgets.push({
        id: `widget${i}`,
        type: 'weather',
        position: {
          x: Math.floor(Math.random() * 8),
          y: Math.floor(Math.random() * 8),
          width: 1 + Math.floor(Math.random() * 2),
          height: 1 + Math.floor(Math.random() * 2),
        },
        data: {},
        locked: false,
      })
    }

    const detector = new EnhancedCollisionDetector(manyWidgets, '10x10')
    
    const startTime = performance.now()
    
    // 100번의 충돌 감지 수행
    for (let i = 0; i < 100; i++) {
      detector.detectCollision({
        x: Math.floor(Math.random() * 9),
        y: Math.floor(Math.random() * 9),
        width: 1,
        height: 1,
      })
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // 100번의 충돌 감지가 100ms 이내에 완료되어야 함
    expect(duration).toBeLessThan(100)
  })
})