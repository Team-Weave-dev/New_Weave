# iOS 스타일 위젯 편집 시스템 설계서

## 📱 개요

현재의 고정 그리드 기반 위젯 시스템을 iOS/iPadOS의 홈 화면 편집 경험과 유사한 유연하고 직관적인 시스템으로 전면 재설계합니다.

### 핵심 목표
- **직관적인 편집**: 편집 버튼 클릭 시 위젯이 "흔들리며" 자유롭게 이동 가능
- **유연한 배치**: 고정 그리드(2x2, 3x3) 제약 제거, 자유로운 크기와 위치
- **자동 재배치**: 위젯 이동 시 다른 위젯들이 자동으로 재배치
- **부드러운 애니메이션**: 모든 인터랙션에 iOS 스타일 스프링 애니메이션 적용

## 🏗️ 아키텍처

### 1. 타입 시스템 재설계

#### 기존 시스템 (제거 예정)
```typescript
// 고정 그리드 크기 - 제거
export type GridSize = '2x2' | '3x3' | '4x4' | '5x5'

// 기존 위치 시스템 - 개선 필요
export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}
```

#### 새로운 시스템
```typescript
// 유연한 위젯 위치 (그리드 유닛 기반)
export interface FlexibleWidgetPosition {
  gridX: number      // 그리드 X 좌표 (0부터 시작)
  gridY: number      // 그리드 Y 좌표 (0부터 시작)
  gridWidth: number  // 위젯 너비 (그리드 유닛)
  gridHeight: number // 위젯 높이 (그리드 유닛)
}

// 위젯 크기 프리셋
export type WidgetSize = '1x1' | '2x1' | '2x2' | '4x1' | '4x2' | 'custom'

// 편집 모드 상태
export type EditModeState = 'idle' | 'entering' | 'active' | 'exiting'

// 개선된 위젯 인터페이스
export interface IOSStyleWidget {
  id: string
  type: string
  position: FlexibleWidgetPosition
  size: WidgetSize
  config?: Record<string, any>
  locked?: boolean
  isWiggling?: boolean  // 편집 모드 시 wiggle 애니메이션
}

// 대시보드 레이아웃 (그리드 크기 제약 제거)
export interface IOSStyleDashboardLayout {
  id: string
  name: string
  columns: number  // 동적 컬럼 수 (기본: 4, 모바일: 2)
  widgets: IOSStyleWidget[]
  editMode: EditModeState
  createdAt: Date
  updatedAt: Date
}
```

### 2. 그리드 엔진 설계

#### FlexibleGridEngine 클래스
```typescript
class FlexibleGridEngine {
  private columns: number
  private widgets: IOSStyleWidget[]
  private occupancyMap: boolean[][]

  // 자동 재배치 알고리즘
  autoReflow(widgets: IOSStyleWidget[]): IOSStyleWidget[]
  
  // 충돌 감지
  detectCollisions(widget: IOSStyleWidget, targetPos: FlexibleWidgetPosition): IOSStyleWidget[]
  
  // 빈 공간 찾기
  findEmptySpace(size: WidgetSize): FlexibleWidgetPosition | null
  
  // Gravity 효과 (위젯을 위로 당기기)
  applyGravity(): void
  
  // 위젯 위치 유효성 검사
  validatePosition(position: FlexibleWidgetPosition): boolean
  
  // 최적 위치 추천
  suggestBestPosition(widget: IOSStyleWidget): FlexibleWidgetPosition
}
```

#### 반응형 그리드 시스템
```typescript
interface ResponsiveGridConfig {
  mobile: { columns: 2, minWidgetSize: '1x1' }
  tablet: { columns: 4, minWidgetSize: '1x1' }  
  desktop: { columns: 6, minWidgetSize: '1x1' }
  ultrawide: { columns: 8, minWidgetSize: '1x1' }
}
```

### 3. 애니메이션 시스템

#### Wiggle 애니메이션 (Framer Motion)
```typescript
const wiggleAnimation = {
  rotate: [0, -2, 2, -2, 2, 0],
  scale: [1, 0.98, 1.02, 0.98, 1.02, 1],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
}
```

#### 드래그 애니메이션
```typescript
const dragAnimation = {
  scale: 1.05,
  shadow: "0 10px 30px rgba(0,0,0,0.3)",
  zIndex: 1000,
  transition: {
    type: "spring",
    damping: 20,
    stiffness: 300
  }
}
```

#### 재배치 애니메이션
```typescript
const reorderAnimation = {
  layout: true,
  transition: {
    type: "spring",
    damping: 25,
    stiffness: 350
  }
}
```

## 🧩 핵심 컴포넌트

### 1. IOSStyleDashboard
최상위 대시보드 컨테이너
- 편집 모드 상태 관리
- 길게 누르기 감지
- 전체 레이아웃 조정

### 2. FlexibleGridContainer  
동적 그리드 레이아웃 관리
- CSS Grid 기반
- 반응형 컬럼 조정
- @react-beautiful-dnd

### 3. WiggleWidget
iOS 스타일 위젯 래퍼
- Wiggle 애니메이션
- 삭제/설정 버튼 오버레이
- 터치/마우스 이벤트 처리

### 4. AutoFlowEngine
자동 재배치 엔진
- 충돌 감지 및 해결
- Gravity 효과 구현
- 최적 배치 알고리즘

### 5. EditModeToolbar
편집 모드 툴바
- 완료 버튼
- 위젯 추가 버튼
- 레이아웃 저장/불러오기

## 🔄 자동 재배치 알고리즘

### 1. Collision Detection
```javascript
// 2D 점유 맵으로 충돌 감지
function detectCollisions(widget, targetPosition) {
  const collisions = []
  for (let x = targetPosition.gridX; x < targetPosition.gridX + widget.gridWidth; x++) {
    for (let y = targetPosition.gridY; y < targetPosition.gridY + widget.gridHeight; y++) {
      if (occupancyMap[y][x] && occupancyMap[y][x] !== widget.id) {
        collisions.push(occupancyMap[y][x])
      }
    }
  }
  return [...new Set(collisions)]
}
```

### 2. Auto Reflow
```javascript
// 위젯들을 위로 당기는 gravity 효과
function applyGravity(widgets) {
  const sorted = widgets.sort((a, b) => a.position.gridY - b.position.gridY)
  
  sorted.forEach(widget => {
    let newY = 0
    while (newY < widget.position.gridY) {
      if (canMoveTo(widget, { ...widget.position, gridY: newY })) {
        widget.position.gridY = newY
        break
      }
      newY++
    }
  })
  
  return sorted
}
```

### 3. Smart Placement
```javascript
// 드롭 시 최적 위치 찾기
function findBestPosition(widget, dropPoint) {
  // 1. 드롭 지점에 가장 가까운 그리드 위치 계산
  const targetPos = pixelToGrid(dropPoint)
  
  // 2. 충돌 확인
  if (!hasCollision(widget, targetPos)) {
    return targetPos
  }
  
  // 3. 나선형으로 빈 공간 탐색
  return findNearestEmptySpace(targetPos, widget.size)
}
```

## 📱 UX 플로우

### 편집 모드 진입
1. **방법 1**: 편집 버튼 클릭
2. **방법 2**: 위젯 길게 누르기 (1초)
3. **효과**: 
   - 모든 위젯이 wiggle 애니메이션 시작
   - 각 위젯 좌상단에 삭제(X) 버튼 표시
   - 우측 하단에 위젯 추가(+) FAB 표시

### 위젯 이동
1. 위젯 드래그 시작 → 약간 확대 & 그림자 효과
2. 드래그 중 → 다른 위젯들 실시간 재배치
3. 드롭 → 스프링 애니메이션으로 자리 잡기

### 편집 모드 종료
1. 완료 버튼 클릭 또는 ESC 키
2. Wiggle 애니메이션 페이드아웃
3. 삭제 버튼 숨김

## 🛠️ 기술 스택

### 유지
- **@react-beautiful-dnd**: 드래그앤드롭 
- **framer-motion**: 애니메이션 (wiggle, 전환 효과)
- **Zustand**: 상태 관리
- **Tailwind CSS**: 스타일링

### 신규 도입
- **CSS Grid**: 유연한 레이아웃 (기존 flex 대체)
- **Pointer Events API**: 통합된 터치/마우스 처리
- **ResizeObserver**: 반응형 그리드 조정

## 📊 성능 최적화

### 1. 가상화
- 화면 밖 위젯은 렌더링하지 않음
- Intersection Observer로 뷰포트 감지

### 2. 애니메이션 최적화
- GPU 가속 (transform, opacity만 사용)
- will-change 속성 활용
- requestAnimationFrame으로 프레임 제어

### 3. 상태 관리 최적화
- 위젯별 독립적 상태 관리
- 메모이제이션 적극 활용
- 불필요한 리렌더링 방지

## 🔄 마이그레이션 전략

### Phase 1: 기반 구축
- 새로운 타입 시스템 정의
- FlexibleGridEngine 구현
- 애니메이션 시스템 구축

### Phase 2: 컴포넌트 개발
- IOSStyleDashboard 컴포넌트
- WiggleWidget 래퍼
- AutoFlowEngine 통합

### Phase 3: 기능 통합
- 기존 위젯들을 새 시스템으로 마이그레이션
- Feature flag로 점진적 롤아웃
- 기존 레이아웃 데이터 변환

### Phase 4: 최적화 & 마무리
- 성능 최적화
- 접근성 개선
- 기존 시스템 제거

## 📝 예상 파일 구조

```
src/
├── components/
│   └── dashboard/
│       ├── ios-style/           # 새로운 iOS 스타일 시스템
│       │   ├── IOSStyleDashboard.tsx
│       │   ├── FlexibleGridContainer.tsx
│       │   ├── WiggleWidget.tsx
│       │   ├── AutoFlowEngine.ts
│       │   ├── EditModeToolbar.tsx
│       │   └── animations/
│       │       ├── wiggle.ts
│       │       ├── drag.ts
│       │       └── reorder.ts
│       └── legacy/              # 기존 시스템 (임시 유지)
├── lib/
│   └── dashboard/
│       ├── flexible-grid/
│       │   ├── FlexibleGridEngine.ts
│       │   ├── collision-detection.ts
│       │   ├── auto-reflow.ts
│       │   └── responsive-grid.ts
│       └── ios-animations/
│           └── spring-physics.ts
└── types/
    └── ios-dashboard.ts       # 새로운 타입 정의
```

## ✅ 주요 이점

1. **직관적인 UX**: iOS 사용자에게 익숙한 편집 경험
2. **유연한 레이아웃**: 고정 그리드 제약 없이 자유로운 배치
3. **자동 최적화**: 빈 공간 자동 채우기, 충돌 자동 해결
4. **부드러운 애니메이션**: 네이티브 앱 수준의 인터랙션
5. **반응형 디자인**: 화면 크기에 따른 자동 조정
6. **성능 최적화**: 가상화와 GPU 가속 활용

## 🚀 다음 단계

1. 프로토타입 구현 (Phase 1)
2. 사용자 테스트 및 피드백 수집
3. 점진적 마이그레이션 시작
4. 성능 모니터링 및 최적화