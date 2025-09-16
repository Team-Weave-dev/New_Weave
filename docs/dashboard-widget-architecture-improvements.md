# 📊 대시보드 위젯 시스템 아키텍처 개선 설계서

## 🔍 현재 시스템 분석 결과

### 강점
- ✅ 체계적인 위젯 레지스트리 시스템 (`WidgetRegistry` 클래스)
- ✅ Lazy Loading으로 성능 최적화
- ✅ 카테고리별 위젯 관리 (project, tax, analytics, productivity, custom)
- ✅ 드래그 앤 드롭 지원 (@dnd-kit 통합)
- ✅ 반응형 디자인 및 모바일 지원
- ✅ 중앙화된 색상 시스템 (widgetColors)

### 개선 필요 영역
- ❗ 위젯 간 데이터 공유 메커니즘 부재
- ❗ 실시간 업데이트 시스템 미구현
- ❗ 위젯 설정 저장/복원 기능 제한적
- ❗ 캘린더 위젯 중복 (CalendarWidget, TaxDeadlineWidget)
- ❗ 위젯 종류 부족 (10개)

## 📅 캘린더 위젯 통합 방안

### 옵션 1: 통합 캘린더 (권장) ⭐
```typescript
// UnifiedCalendarWidget
interface UnifiedCalendarWidget {
  type: 'unified-calendar'
  viewModes: ['calendar', 'list', 'timeline']
  eventTypes: ['general', 'tax', 'project', 'personal']
  features: {
    filtering: boolean      // 이벤트 타입별 필터링
    colorCoding: boolean    // 타입별 색상 구분
    multiView: boolean      // 다중 뷰 모드
    syncEnabled: boolean    // 외부 캘린더 동기화
  }
}
```

### 옵션 2: 뷰 타입별 분리 (사용자 요청)
```typescript
// 1. CalendarViewWidget - 달력형
interface CalendarViewWidget {
  type: 'calendar-view'
  defaultView: 'month' | 'week' | 'day'
  displayMode: 'grid'
  features: {
    dragAndDrop: boolean
    quickAdd: boolean
    miniCalendar: boolean
  }
}

// 2. EventListWidget - 목록형
interface EventListWidget {
  type: 'event-list'
  sortBy: 'date' | 'priority' | 'category'
  displayMode: 'list' | 'timeline'
  features: {
    grouping: boolean
    filtering: boolean
    search: boolean
  }
}
```

### 구현 전략
1. **데이터 통합 레이어**: 모든 캘린더 데이터를 통합 관리하는 `CalendarDataService`
2. **이벤트 타입 시스템**: 확장 가능한 이벤트 타입 정의
3. **뷰 컴포넌트 분리**: 데이터와 뷰를 분리하여 재사용성 향상

## 🆕 추가할 신규 위젯 컴포넌트 (12개)

### 생산성 카테고리
```yaml
time-tracker:
  name: "시간 추적기"
  description: "프로젝트별 시간 추적 및 리포트"
  defaultSize: { width: 2, height: 1 }
  features: [타이머, 프로젝트별 집계, 일일/주간 리포트]

pomodoro:
  name: "뽀모도로 타이머"
  description: "집중력 향상을 위한 타이머"
  defaultSize: { width: 1, height: 1 }
  features: [25분 타이머, 휴식 알림, 일일 세션 추적]

quick-notes:
  name: "빠른 메모"
  description: "간단한 메모와 아이디어 저장"
  defaultSize: { width: 1, height: 2 }
  features: [마크다운 지원, 태그, 검색]

weather:
  name: "날씨 정보"
  description: "현재 위치 날씨 및 예보"
  defaultSize: { width: 1, height: 1 }
  features: [현재 날씨, 5일 예보, 위치 설정]
```

### 분석 카테고리
```yaml
expense-tracker:
  name: "지출 관리"
  description: "카테고리별 지출 추적 및 분석"
  defaultSize: { width: 2, height: 2 }
  features: [카테고리 분류, 예산 설정, 지출 트렌드]

cash-flow:
  name: "현금 흐름"
  description: "수입/지출 현금 흐름 시각화"
  defaultSize: { width: 3, height: 1 }
  features: [월별 비교, 예측, 알림]

client-overview:
  name: "고객 현황"
  description: "고객별 프로젝트 및 매출 현황"
  defaultSize: { width: 2, height: 2 }
  features: [고객 목록, 매출 분석, 프로젝트 상태]

invoice-status:
  name: "청구서 상태"
  description: "미수금 및 청구서 관리"
  defaultSize: { width: 2, height: 1 }
  features: [미수금 현황, 만기일 알림, 자동 리마인더]
```

### 커뮤니케이션 카테고리
```yaml
notification-center:
  name: "알림 센터"
  description: "모든 알림을 한 곳에서 관리"
  defaultSize: { width: 1, height: 2 }
  features: [우선순위, 읽음 표시, 필터링]

team-status:
  name: "팀원 상태"
  description: "팀원 업무 상태 및 가용성"
  defaultSize: { width: 2, height: 1 }
  features: [온라인 상태, 현재 작업, 일정]

quick-links:
  name: "바로가기"
  description: "자주 사용하는 링크 모음"
  defaultSize: { width: 1, height: 1 }
  features: [커스텀 링크, 아이콘, 카테고리]

announcements:
  name: "공지사항"
  description: "중요 공지 및 업데이트"
  defaultSize: { width: 2, height: 1 }
  features: [우선순위, 만료일, 읽음 확인]
```

## 🔧 기존 위젯 개선 방향

### ProjectSummaryWidget
```typescript
// 개선 사항
- 프로젝트 진행률 시각화 (Progress Bar, Gauge Chart)
- 마일스톤 타임라인 표시
- 팀원 아바타 및 역할 표시
- 프로젝트 상태별 필터링
- 빠른 액션 버튼 (새 작업, 미팅 예약)
```

### RevenueChartWidget
```typescript
// 개선 사항
- 차트 타입 선택 (Line, Bar, Pie, Area)
- 비교 기간 설정 (YoY, MoM, Custom)
- 데이터 필터링 (프로젝트별, 고객별)
- 데이터 내보내기 (CSV, PDF)
- 드릴다운 기능
```

### TaskTrackerWidget
```typescript
// 개선 사항
- 칸반 보드 뷰 추가
- 우선순위 드래그 앤 드롭
- 서브태스크 및 체크리스트
- 담당자 할당 및 멘션
- 작업 템플릿
```

### KPIWidget
```typescript
// 개선 사항
- 커스텀 KPI 지표 생성
- 목표 대비 진행률 표시
- 트렌드 그래프 및 스파크라인
- 조건부 포맷팅 (색상 코딩)
- KPI 공식 편집기
```

### TodoListWidget
```typescript
// 개선 사항
- 카테고리 및 태그 시스템
- 반복 작업 설정
- 마감일 알림 및 리마인더
- 우선순위 매트릭스 뷰
- 음성 메모 첨부
```

## 🏗️ 아키텍처 개선 로드맵

### Phase 1: 핵심 인프라 개선 (2주)
```typescript
// 1. 위젯 간 통신 시스템
class WidgetEventBus {
  private subscribers: Map<string, Set<WidgetEventHandler>>
  
  emit(event: WidgetEvent): void
  subscribe(eventType: string, handler: WidgetEventHandler): void
  unsubscribe(eventType: string, handler: WidgetEventHandler): void
}

// 2. 공유 데이터 스토어
interface SharedDataStore {
  widgets: Map<string, WidgetData>
  subscriptions: Map<string, Set<string>>
  
  getData(widgetId: string): WidgetData
  setData(widgetId: string, data: WidgetData): void
  subscribe(widgetId: string, subscriberId: string): void
}
```

### Phase 2: 실시간 업데이트 (1주)
```typescript
// Supabase Realtime 통합
class RealtimeManager {
  private channels: Map<string, RealtimeChannel>
  
  subscribeToWidget(widgetId: string, callback: Function): void
  broadcastUpdate(widgetId: string, data: any): void
  handleReconnection(): void
}
```

### Phase 3: 위젯 설정 관리 (1주)
```typescript
// 위젯 설정 관리자
class WidgetConfigManager {
  saveConfig(widgetId: string, config: WidgetConfig): Promise<void>
  loadConfig(widgetId: string): Promise<WidgetConfig>
  exportPreset(name: string, widgetIds: string[]): Promise<PresetData>
  importPreset(presetData: PresetData): Promise<void>
}
```

### Phase 4: 성능 최적화 (1주)
```typescript
// 성능 최적화 전략
const optimizations = {
  virtualScrolling: true,        // 긴 목록 가상화
  intersectionObserver: true,    // 뷰포트 기반 로딩
  memoization: true,             // React.memo 적용
  debouncing: true,              // API 호출 디바운싱
  caching: true,                 // 로컬 캐싱 전략
  webWorkers: true               // 무거운 연산 워커 처리
}
```

### Phase 5: 접근성 개선 (1주)
```typescript
// 접근성 개선 사항
const a11yImprovements = {
  keyboardNavigation: {
    tabIndex: true,
    arrowKeys: true,
    shortcuts: true
  },
  screenReader: {
    ariaLabels: true,
    liveRegions: true,
    announcements: true
  },
  wcag: {
    colorContrast: 'AA',
    focusIndicators: true,
    skipLinks: true
  }
}
```

## 📊 구현 우선순위

### Priority 1 (즉시 구현)
1. **캘린더 위젯 통합** - CalendarViewWidget, EventListWidget
2. **위젯 간 통신 시스템** - WidgetEventBus
3. **TimeTrackerWidget** - 생산성 향상 핵심
4. **ExpenseTrackerWidget** - 비즈니스 핵심 기능

### Priority 2 (2주 내)
5. **실시간 업데이트 시스템** - Supabase Realtime
6. **NotificationWidget** - 사용자 참여도 향상
7. **ClientOverviewWidget** - 비즈니스 가치
8. **TaskTracker 개선** - 칸반 보드 뷰

### Priority 3 (1개월 내)
9. **위젯 설정 관리** - ConfigManager
10. **CashFlowWidget** - 재무 분석
11. **TeamStatusWidget** - 협업 강화
12. **성능 최적화** - Virtual Scrolling

### Priority 4 (2개월 내)
13. **나머지 신규 위젯** - 우선순위 낮은 위젯들
14. **접근성 개선** - WCAG 준수
15. **기존 위젯 개선** - 점진적 업데이트

## 🎯 성공 지표

### 기술적 지표
- 위젯 로딩 시간 < 500ms
- 실시간 업데이트 지연 < 100ms
- 메모리 사용량 < 200MB
- Lighthouse 점수 > 90

### 사용자 경험 지표
- 위젯 사용률 > 80%
- 평균 세션 시간 > 10분
- 위젯 커스터마이징 사용률 > 60%
- 사용자 만족도 > 4.5/5

### 비즈니스 지표
- 활성 사용자 증가율 > 20%
- 위젯 기반 작업 완료율 > 75%
- 데이터 정확도 > 99%
- 시스템 가동률 > 99.9%

## 💡 혁신적 기능 제안

### AI 기반 위젯 추천
```typescript
// 사용 패턴 분석을 통한 위젯 추천
class WidgetRecommendationEngine {
  analyzeUsagePattern(userId: string): UsagePattern
  recommendWidgets(pattern: UsagePattern): WidgetType[]
  suggestLayout(widgets: WidgetType[]): GridLayout
}
```

### 위젯 마켓플레이스
```typescript
// 커뮤니티 위젯 공유 플랫폼
interface WidgetMarketplace {
  browse(): CommunityWidget[]
  install(widgetId: string): Promise<void>
  publish(widget: CustomWidget): Promise<void>
  rate(widgetId: string, rating: number): Promise<void>
}
```

### 스마트 대시보드
```typescript
// 컨텍스트 기반 자동 레이아웃
class SmartDashboard {
  detectContext(): DashboardContext // 시간, 위치, 작업
  adjustLayout(context: DashboardContext): void
  prioritizeWidgets(context: DashboardContext): void
  hideIrrelevantWidgets(): void
}
```

## 📝 결론

이번 아키텍처 개선을 통해 Weave 대시보드는:
- **더 유연한** 위젯 시스템
- **더 똑똑한** 데이터 연동
- **더 빠른** 성능
- **더 편리한** 사용자 경험

을 제공하게 될 것입니다. 단계별 구현을 통해 리스크를 최소화하면서 지속적인 가치 전달이 가능합니다.