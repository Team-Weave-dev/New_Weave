/**
 * Quadtree 공간 분할 알고리즘을 위한 데이터 구조
 * 위젯 충돌 감지 성능 최적화를 위해 사용
 */

import { Widget, WidgetPosition } from '@/types/dashboard'

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

interface QuadtreeNode<T> {
  bounds: Rectangle
  items: T[]
  children: QuadtreeNode<T>[] | null
  depth: number
}

export class Quadtree<T extends { position: Rectangle }> {
  private root: QuadtreeNode<T>
  private maxItems: number
  private maxDepth: number

  constructor(
    bounds: Rectangle,
    maxItems: number = 4,
    maxDepth: number = 5
  ) {
    this.root = {
      bounds,
      items: [],
      children: null,
      depth: 0,
    }
    this.maxItems = maxItems
    this.maxDepth = maxDepth
  }

  /**
   * Quadtree에 아이템 삽입
   */
  insert(item: T): void {
    this.insertIntoNode(this.root, item)
  }

  private insertIntoNode(node: QuadtreeNode<T>, item: T): void {
    // 아이템이 노드 경계에 포함되지 않으면 무시
    if (!this.intersects(node.bounds, item.position)) {
      return
    }

    // 자식 노드가 있으면 적절한 자식에 삽입
    if (node.children !== null) {
      for (const child of node.children) {
        this.insertIntoNode(child, item)
      }
      return
    }

    // 현재 노드에 아이템 추가
    node.items.push(item)

    // 최대 아이템 수 초과 시 분할
    if (
      node.items.length > this.maxItems &&
      node.depth < this.maxDepth
    ) {
      this.subdivide(node)
    }
  }

  /**
   * 노드를 4개의 자식 노드로 분할
   */
  private subdivide(node: QuadtreeNode<T>): void {
    const { x, y, width, height } = node.bounds
    const halfWidth = width / 2
    const halfHeight = height / 2

    node.children = [
      // 왼쪽 위
      {
        bounds: { x, y, width: halfWidth, height: halfHeight },
        items: [],
        children: null,
        depth: node.depth + 1,
      },
      // 오른쪽 위
      {
        bounds: { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        items: [],
        children: null,
        depth: node.depth + 1,
      },
      // 왼쪽 아래
      {
        bounds: { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        items: [],
        children: null,
        depth: node.depth + 1,
      },
      // 오른쪽 아래
      {
        bounds: {
          x: x + halfWidth,
          y: y + halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        items: [],
        children: null,
        depth: node.depth + 1,
      },
    ]

    // 기존 아이템들을 자식 노드로 재분배
    const items = node.items
    node.items = []
    for (const item of items) {
      for (const child of node.children) {
        this.insertIntoNode(child, item)
      }
    }
  }

  /**
   * 주어진 영역과 충돌 가능한 아이템들 검색
   */
  query(bounds: Rectangle): T[] {
    const results: T[] = []
    this.queryNode(this.root, bounds, results)
    return results
  }

  private queryNode(
    node: QuadtreeNode<T>,
    bounds: Rectangle,
    results: T[]
  ): void {
    // 노드와 검색 영역이 교차하지 않으면 무시
    if (!this.intersects(node.bounds, bounds)) {
      return
    }

    // 현재 노드의 아이템 중 교차하는 것들 추가
    for (const item of node.items) {
      if (this.intersects(item.position, bounds)) {
        results.push(item)
      }
    }

    // 자식 노드들도 재귀적으로 검색
    if (node.children !== null) {
      for (const child of node.children) {
        this.queryNode(child, bounds, results)
      }
    }
  }

  /**
   * 두 사각형이 교차하는지 확인
   */
  private intersects(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
      rect1.x + rect1.width <= rect2.x ||
      rect2.x + rect2.width <= rect1.x ||
      rect1.y + rect1.height <= rect2.y ||
      rect2.y + rect2.height <= rect1.y
    )
  }

  /**
   * Quadtree 초기화
   */
  clear(): void {
    this.root.items = []
    this.root.children = null
  }

  /**
   * 디버깅용 트리 구조 출력
   */
  getTreeStructure(): string {
    return this.nodeToString(this.root, '')
  }

  private nodeToString(node: QuadtreeNode<T>, indent: string): string {
    let result = `${indent}Node (depth: ${node.depth}, items: ${node.items.length})\n`
    
    if (node.children !== null) {
      for (let i = 0; i < node.children.length; i++) {
        result += this.nodeToString(node.children[i], indent + '  ')
      }
    }
    
    return result
  }
}

/**
 * 위젯 전용 Quadtree 생성
 */
export function createWidgetQuadtree(
  widgets: Widget[],
  gridColumns: number
): Quadtree<Widget> {
  const tree = new Quadtree<Widget>(
    {
      x: 0,
      y: 0,
      width: gridColumns,
      height: gridColumns, // 정사각형 그리드 가정
    },
    4, // 노드당 최대 4개 위젯
    5  // 최대 깊이 5
  )

  for (const widget of widgets) {
    tree.insert(widget)
  }

  return tree
}

/**
 * Quadtree를 사용한 효율적인 충돌 감지
 */
export function findCollisionsWithQuadtree(
  quadtree: Quadtree<Widget>,
  testPosition: WidgetPosition,
  excludeWidgetId?: string
): Widget[] {
  const candidates = quadtree.query(testPosition)
  
  return candidates.filter(widget => {
    if (widget.id === excludeWidgetId) return false
    
    // 정확한 충돌 검사
    return !(
      testPosition.x + testPosition.width <= widget.position.x ||
      widget.position.x + widget.position.width <= testPosition.x ||
      testPosition.y + testPosition.height <= widget.position.y ||
      widget.position.y + widget.position.height <= testPosition.y
    )
  })
}