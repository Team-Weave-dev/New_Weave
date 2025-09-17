/**
 * 향상된 충돌 감지 시스템
 * Quadtree를 사용한 효율적인 충돌 감지 및 스마트 위젯 재배치
 */

import { Widget, WidgetPosition, GridSize } from '@/types/dashboard'
import { Quadtree, createWidgetQuadtree, findCollisionsWithQuadtree } from './quadtree'
import { getGridColumns, checkCollision } from './collisionDetection'

export interface CollisionOptions {
  /** 부분 겹침 허용 여부 */
  allowPartialOverlap?: boolean
  /** 최대 겹침 비율 (0-1) */
  maxOverlapRatio?: number
  /** 스왑 허용 여부 */
  allowSwap?: boolean
  /** 밀어내기 허용 여부 */
  allowPush?: boolean
}

export interface CollisionResult {
  /** 충돌 여부 */
  hasCollision: boolean
  /** 충돌하는 위젯들 */
  collidingWidgets: Widget[]
  /** 스왑 가능한 위젯 */
  swappableWidget?: Widget
  /** 권장 위치 */
  suggestedPosition?: WidgetPosition
}

/**
 * 향상된 충돌 감지 시스템
 */
export class EnhancedCollisionDetector {
  private quadtree: Quadtree<Widget> | null = null
  private widgets: Widget[]
  private gridSize: GridSize
  private options: CollisionOptions

  constructor(
    widgets: Widget[],
    gridSize: GridSize,
    options: CollisionOptions = {}
  ) {
    this.widgets = widgets
    this.gridSize = gridSize
    this.options = {
      allowPartialOverlap: false,
      maxOverlapRatio: 0,
      allowSwap: true,
      allowPush: true,
      ...options,
    }
    this.buildQuadtree()
  }

  /**
   * Quadtree 재구성
   */
  private buildQuadtree(): void {
    const columns = getGridColumns(this.gridSize)
    this.quadtree = createWidgetQuadtree(this.widgets, columns)
  }

  /**
   * 위젯 목록 업데이트
   */
  updateWidgets(widgets: Widget[]): void {
    this.widgets = widgets
    this.buildQuadtree()
  }

  /**
   * 충돌 감지 수행
   */
  detectCollision(
    position: WidgetPosition,
    widgetId?: string
  ): CollisionResult {
    if (!this.quadtree) {
      this.buildQuadtree()
    }

    // Quadtree를 사용한 빠른 충돌 후보 검색
    const collidingWidgets = findCollisionsWithQuadtree(
      this.quadtree!,
      position,
      widgetId
    )

    // 부분 겹침 허용 시 필터링
    const filteredCollisions = this.options.allowPartialOverlap
      ? collidingWidgets.filter(widget => {
          const overlapRatio = this.calculateOverlapRatio(position, widget.position)
          return overlapRatio > this.options.maxOverlapRatio!
        })
      : collidingWidgets

    const result: CollisionResult = {
      hasCollision: filteredCollisions.length > 0,
      collidingWidgets: filteredCollisions,
    }

    // 충돌이 있을 때 추가 분석
    if (result.hasCollision) {
      // 스왑 가능 여부 확인
      if (this.options.allowSwap) {
        result.swappableWidget = this.findSwappableWidget(
          position,
          filteredCollisions,
          widgetId
        )
      }

      // 대체 위치 제안
      result.suggestedPosition = this.findAlternativePosition(
        position,
        widgetId
      )
    }

    return result
  }

  /**
   * 두 위치 간의 겹침 비율 계산
   */
  private calculateOverlapRatio(
    pos1: WidgetPosition,
    pos2: WidgetPosition
  ): number {
    const xOverlap = Math.max(
      0,
      Math.min(pos1.x + pos1.width, pos2.x + pos2.width) - 
      Math.max(pos1.x, pos2.x)
    )
    const yOverlap = Math.max(
      0,
      Math.min(pos1.y + pos1.height, pos2.y + pos2.height) - 
      Math.max(pos1.y, pos2.y)
    )

    const overlapArea = xOverlap * yOverlap
    const area1 = pos1.width * pos1.height
    const area2 = pos2.width * pos2.height
    const minArea = Math.min(area1, area2)

    return minArea > 0 ? overlapArea / minArea : 0
  }

  /**
   * 스왑 가능한 위젯 찾기
   */
  private findSwappableWidget(
    position: WidgetPosition,
    collidingWidgets: Widget[],
    widgetId?: string
  ): Widget | undefined {
    const sourceWidget = this.widgets.find(w => w.id === widgetId)
    if (!sourceWidget) return undefined

    // 단일 위젯과 충돌하고, 크기가 호환되면 스왑 가능
    if (collidingWidgets.length === 1) {
      const targetWidget = collidingWidgets[0]
      
      // 잠긴 위젯은 스왑 불가
      if (targetWidget.locked) return undefined

      // 서로의 위치에서 충돌이 없는지 확인
      const sourceInTargetPos = this.isPositionValid(
        targetWidget.position,
        widgetId
      )
      const targetInSourcePos = this.isPositionValid(
        sourceWidget.position,
        targetWidget.id
      )

      if (sourceInTargetPos && targetInSourcePos) {
        return targetWidget
      }
    }

    return undefined
  }

  /**
   * 위치가 유효한지 확인
   */
  private isPositionValid(
    position: WidgetPosition,
    excludeId?: string
  ): boolean {
    const columns = getGridColumns(this.gridSize)
    const rows = columns

    // 경계 체크
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x + position.width > columns ||
      position.y + position.height > rows
    ) {
      return false
    }

    // 충돌 체크
    for (const widget of this.widgets) {
      if (widget.id === excludeId) continue
      if (checkCollision(position, widget.position)) {
        return false
      }
    }

    return true
  }

  /**
   * 대체 위치 찾기 (최적화된 버전)
   */
  private findAlternativePosition(
    targetPosition: WidgetPosition,
    widgetId?: string
  ): WidgetPosition | undefined {
    const columns = getGridColumns(this.gridSize)
    const rows = columns

    // BFS를 사용한 가장 가까운 빈 위치 찾기
    const visited = new Set<string>()
    const queue: Array<{ x: number; y: number; distance: number }> = [
      { x: targetPosition.x, y: targetPosition.y, distance: 0 }
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      const key = `${current.x},${current.y}`

      if (visited.has(key)) continue
      visited.add(key)

      const testPosition: WidgetPosition = {
        x: current.x,
        y: current.y,
        width: targetPosition.width,
        height: targetPosition.height,
      }

      // 경계 체크
      if (
        current.x >= 0 &&
        current.y >= 0 &&
        current.x + targetPosition.width <= columns &&
        current.y + targetPosition.height <= rows
      ) {
        // 충돌 체크 (Quadtree 사용)
        const collisions = findCollisionsWithQuadtree(
          this.quadtree!,
          testPosition,
          widgetId
        )

        if (collisions.length === 0) {
          return testPosition
        }
      }

      // 인접한 위치들을 큐에 추가
      if (current.distance < Math.max(columns, rows)) {
        const directions = [
          { dx: 0, dy: -1 }, // 위
          { dx: 1, dy: 0 },  // 오른쪽
          { dx: 0, dy: 1 },  // 아래
          { dx: -1, dy: 0 }, // 왼쪽
        ]

        for (const { dx, dy } of directions) {
          const newX = current.x + dx
          const newY = current.y + dy
          const newKey = `${newX},${newY}`

          if (!visited.has(newKey)) {
            queue.push({
              x: newX,
              y: newY,
              distance: current.distance + 1,
            })
          }
        }
      }
    }

    return undefined
  }

  /**
   * 스마트 위젯 재배치 (밀어내기)
   */
  pushWidgets(
    movedWidget: Widget,
    newPosition: WidgetPosition
  ): Widget[] {
    if (!this.options.allowPush) {
      return this.widgets
    }

    const updatedWidgets = [...this.widgets]
    const movedIndex = updatedWidgets.findIndex(w => w.id === movedWidget.id)
    
    if (movedIndex === -1) return updatedWidgets

    // 이동한 위젯 위치 업데이트
    updatedWidgets[movedIndex] = {
      ...movedWidget,
      position: newPosition,
    }

    // 충돌하는 위젯들 찾기
    const collisions = findCollisionsWithQuadtree(
      this.quadtree!,
      newPosition,
      movedWidget.id
    )

    // 각 충돌 위젯을 밀어내기
    for (const collidingWidget of collisions) {
      if (collidingWidget.locked) continue

      const pushDirection = this.calculatePushDirection(
        newPosition,
        collidingWidget.position
      )

      const pushedPosition = this.calculatePushedPosition(
        collidingWidget,
        pushDirection
      )

      if (pushedPosition) {
        const widgetIndex = updatedWidgets.findIndex(
          w => w.id === collidingWidget.id
        )
        if (widgetIndex !== -1) {
          updatedWidgets[widgetIndex] = {
            ...collidingWidget,
            position: pushedPosition,
          }
        }
      }
    }

    return updatedWidgets
  }

  /**
   * 밀어낼 방향 계산
   */
  private calculatePushDirection(
    pusherPos: WidgetPosition,
    targetPos: WidgetPosition
  ): 'up' | 'down' | 'left' | 'right' {
    const pusherCenterX = pusherPos.x + pusherPos.width / 2
    const pusherCenterY = pusherPos.y + pusherPos.height / 2
    const targetCenterX = targetPos.x + targetPos.width / 2
    const targetCenterY = targetPos.y + targetPos.height / 2

    const dx = targetCenterX - pusherCenterX
    const dy = targetCenterY - pusherCenterY

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  /**
   * 밀려난 위치 계산
   */
  private calculatePushedPosition(
    widget: Widget,
    direction: 'up' | 'down' | 'left' | 'right'
  ): WidgetPosition | undefined {
    const columns = getGridColumns(this.gridSize)
    const rows = columns
    const position = widget.position

    let newPosition: WidgetPosition

    switch (direction) {
      case 'up':
        newPosition = { ...position, y: Math.max(0, position.y - 1) }
        break
      case 'down':
        newPosition = {
          ...position,
          y: Math.min(rows - position.height, position.y + 1),
        }
        break
      case 'left':
        newPosition = { ...position, x: Math.max(0, position.x - 1) }
        break
      case 'right':
        newPosition = {
          ...position,
          x: Math.min(columns - position.width, position.x + 1),
        }
        break
    }

    // 새 위치가 유효한지 확인
    if (this.isPositionValid(newPosition, widget.id)) {
      return newPosition
    }

    // 대체 방향 시도
    const alternativeDirections = 
      direction === 'up' || direction === 'down'
        ? ['left', 'right'] as const
        : ['up', 'down'] as const

    for (const altDirection of alternativeDirections) {
      const altPosition = this.calculatePushedPosition(widget, altDirection)
      if (altPosition) {
        return altPosition
      }
    }

    return undefined
  }

  /**
   * 빈 공간 찾기 (최적화된 버전)
   */
  findEmptySpaces(
    minWidth: number = 1,
    minHeight: number = 1
  ): WidgetPosition[] {
    const columns = getGridColumns(this.gridSize)
    const rows = columns
    const emptySpaces: WidgetPosition[] = []

    // 그리드를 스캔하여 빈 공간 찾기
    for (let y = 0; y <= rows - minHeight; y++) {
      for (let x = 0; x <= columns - minWidth; x++) {
        // 가능한 최대 크기 찾기
        let maxWidth = minWidth
        let maxHeight = minHeight

        // 너비 확장
        for (let w = minWidth; w <= columns - x; w++) {
          const testPos: WidgetPosition = {
            x,
            y,
            width: w,
            height: minHeight,
          }

          const collisions = findCollisionsWithQuadtree(
            this.quadtree!,
            testPos
          )

          if (collisions.length === 0) {
            maxWidth = w
          } else {
            break
          }
        }

        // 높이 확장
        for (let h = minHeight; h <= rows - y; h++) {
          const testPos: WidgetPosition = {
            x,
            y,
            width: maxWidth,
            height: h,
          }

          const collisions = findCollisionsWithQuadtree(
            this.quadtree!,
            testPos
          )

          if (collisions.length === 0) {
            maxHeight = h
          } else {
            break
          }
        }

        // 빈 공간이 최소 크기 이상이면 추가
        if (maxWidth >= minWidth && maxHeight >= minHeight) {
          emptySpaces.push({
            x,
            y,
            width: maxWidth,
            height: maxHeight,
          })
        }
      }
    }

    return emptySpaces
  }
}