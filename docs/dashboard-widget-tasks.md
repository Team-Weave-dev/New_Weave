# 📋 대시보드 위젯 시스템 구현 태스크 목록

> 📖 **상세 개발 가이드**: 각 태스크의 구체적인 구현 방법, 아키텍처 설계, 코드 예시는 [`dashboard-widget-system-design.md`](./dashboard-widget-system-design.md) 문서를 참조하세요.

## 📅 전체 일정: 6주 (44개 태스크)

---

## 🎯 Phase 1: 기본 인프라 구축 (Week 1)

### [x] **P1-01**: 프로젝트 초기 설정 및 의존성 설치
- **Title**: 프로젝트 초기 설정 및 의존성 설치
- **Description**: 대시보드 위젯 시스템에 필요한 모든 라이브러리 설치 및 프로젝트 구조 설정
- **Status**: `DONE`
- **Dependencies**: None
- **Priority**: `P0 (Critical)`
- **Details**: 
  - @dnd-kit/sortable, @dnd-kit/core 설치
  - zustand 설치 확인
  - framer-motion 설치
  - TypeScript 타입 정의 파일 설정
- **Test Strategy**: 모든 패키지가 올바르게 설치되었는지 확인, 빌드 테스트 실행

### [x] **P1-02**: 그리드 레이아웃 컴포넌트 개발
- **Title**: CSS Grid 기반 레이아웃 시스템 구현
- **Description**: 3×3, 4×4 그리드를 지원하는 기본 레이아웃 컴포넌트 개발
- **Status**: `DONE`
- **Dependencies**: P1-01
- **Priority**: `P0 (Critical)`
- **Details**:
  - GridLayout.tsx 컴포넌트 생성
  - CSS Grid 스타일링 구현
  - 그리드 크기별 동적 렌더링
  - gap, padding 설정 가능
- **Test Strategy**: 
  - 다양한 그리드 크기 렌더링 테스트
  - 반응형 브레이크포인트 테스트
  - props 검증 테스트

### [x] **P1-03**: Zustand 대시보드 스토어 구현
- **Title**: 글로벌 상태 관리 스토어 설정
- **Description**: 대시보드 레이아웃과 위젯 상태를 관리하는 Zustand 스토어 구현
- **Status**: `DONE`
- **Dependencies**: P1-01
- **Priority**: `P0 (Critical)`
- **Details**:
  - useDashboardStore.ts 생성
  - 레이아웃 상태 관리
  - 위젯 CRUD 액션 구현
  - 편집 모드 상태 관리
- **Test Strategy**:
  - 상태 변경 테스트
  - 액션 실행 및 결과 검증
  - 구독 메커니즘 테스트

### [x] **P1-04**: 위젯 래퍼 컴포넌트 개발
- **Title**: 위젯을 감싸는 컨테이너 컴포넌트
- **Description**: 모든 위젯을 감싸고 편집 모드 UI를 제공하는 래퍼 컴포넌트
- **Status**: `DONE`
- **Dependencies**: P1-02, P1-03
- **Priority**: `P1 (High)`
- **Details**:
  - WidgetWrapper.tsx 구현
  - 편집 모드 오버레이
  - 삭제 버튼, 드래그 핸들
  - 위젯 ID 및 메타데이터 관리
- **Test Strategy**:
  - 편집 모드 토글 테스트
  - 이벤트 핸들러 테스트
  - 다양한 위젯 타입 래핑 테스트

### [x] **P1-05**: 편집 모드 툴바 구현
- **Title**: 편집 모드 전환 및 제어 툴바
- **Description**: 대시보드 편집 모드를 제어하는 상단 툴바 컴포넌트
- **Status**: `DONE`
- **Dependencies**: P1-03
- **Priority**: `P1 (High)`
- **Details**:
  - EditModeToolbar.tsx 구현
  - 편집/뷰 모드 토글 버튼
  - 저장/취소 버튼
  - 그리드 크기 선택기
- **Test Strategy**:
  - 버튼 클릭 이벤트 테스트
  - 상태 동기화 테스트
  - UI 렌더링 테스트

### [x] **P1-06**: 기본 위젯 인터페이스 정의
- **Title**: 위젯 타입 정의 및 인터페이스 설계
- **Description**: 모든 위젯이 구현해야 하는 기본 인터페이스와 타입 정의
- **Status**: `DONE`
- **Dependencies**: None
- **Priority**: `P0 (Critical)`
- **Details**:
  - WidgetInterface.ts 생성
  - BaseWidget 추상 클래스
  - WidgetProps 인터페이스
  - WidgetConfig 타입 정의
- **Test Strategy**:
  - TypeScript 컴파일 테스트
  - 인터페이스 구현 검증

### [x] **P1-07**: 대시보드 메인 컨테이너 구현
- **Title**: 대시보드 최상위 컨테이너 컴포넌트
- **Description**: 모든 대시보드 요소를 통합하는 메인 컨테이너
- **Status**: `DONE`
- **Dependencies**: P1-02, P1-03, P1-04, P1-05
- **Priority**: `P1 (High)`
- **Details**:
  - DashboardContainer.tsx 구현
  - 레이아웃 관리
  - 편집 모드 통합
  - 위젯 렌더링 오케스트레이션
- **Test Strategy**:
  - 통합 렌더링 테스트
  - props 전달 테스트
  - 상태 관리 통합 테스트

### [ ] **P1-08**: 개발 환경 스토리북 설정
- **Title**: 컴포넌트 개발 및 테스트를 위한 스토리북 설정
- **Description**: 위젯 및 레이아웃 컴포넌트 개발을 위한 스토리북 환경 구성
- **Status**: `TODO`
- **Dependencies**: P1-01
- **Priority**: `P2 (Medium)`
- **Details**:
  - Storybook 설치 및 설정
  - 기본 컴포넌트 스토리 작성
  - 인터랙티브 컨트롤 설정
- **Test Strategy**:
  - 스토리북 빌드 테스트
  - 컴포넌트 렌더링 확인

---

## 🎯 Phase 2: 드래그 앤 드롭 시스템 (Week 2)

### [ ] **P2-01**: @dnd-kit 라이브러리 통합
- **Title**: 드래그 앤 드롭 라이브러리 통합
- **Description**: @dnd-kit을 프로젝트에 통합하고 기본 설정 구현
- **Status**: `TODO`
- **Dependencies**: P1-02, P1-04
- **Priority**: `P0 (Critical)`
- **Details**:
  - DndContext 설정
  - DragOverlay 구현
  - Droppable/Draggable 컴포넌트 래핑
- **Test Strategy**:
  - 드래그 이벤트 시뮬레이션
  - 드롭 타겟 감지 테스트

### [ ] **P2-02**: 충돌 감지 알고리즘 구현
- **Title**: 위젯 충돌 감지 시스템
- **Description**: 그리드 상에서 위젯 간 충돌을 감지하는 알고리즘 구현
- **Status**: `TODO`
- **Dependencies**: P1-02
- **Priority**: `P0 (Critical)`
- **Details**:
  - collisionDetection.ts 구현
  - 경계 체크 로직
  - 오버랩 감지 알고리즘
  - 유효한 드롭 위치 계산
- **Test Strategy**:
  - 단위 테스트로 다양한 충돌 시나리오 검증
  - 경계 케이스 테스트

### [ ] **P2-03**: 드래그 프리뷰 컴포넌트
- **Title**: 드래그 중 표시되는 프리뷰 구현
- **Description**: 위젯을 드래그할 때 표시되는 시각적 프리뷰 컴포넌트
- **Status**: `TODO`
- **Dependencies**: P2-01
- **Priority**: `P1 (High)`
- **Details**:
  - DragPreview.tsx 구현
  - 반투명 효과
  - 드롭 가능 영역 하이라이트
- **Test Strategy**:
  - 프리뷰 렌더링 테스트
  - 스타일 적용 테스트

### [ ] **P2-04**: 위젯 이동 로직 구현
- **Title**: 위젯 위치 변경 핵심 로직
- **Description**: 드래그 앤 드롭으로 위젯 위치를 변경하는 로직 구현
- **Status**: `TODO`
- **Dependencies**: P2-01, P2-02
- **Priority**: `P0 (Critical)`
- **Details**:
  - handleDragEnd 구현
  - 위치 업데이트 로직
  - 상태 동기화
  - 애니메이션 처리
- **Test Strategy**:
  - 위치 변경 정확성 테스트
  - 상태 업데이트 검증

### [ ] **P2-05**: 자동 리플로우 시스템
- **Title**: 위젯 자동 재배치 알고리즘
- **Description**: 충돌 시 다른 위젯을 자동으로 재배치하는 시스템
- **Status**: `TODO`
- **Dependencies**: P2-02
- **Priority**: `P2 (Medium)`
- **Details**:
  - reflow 알고리즘 구현
  - 최적 위치 찾기
  - 연쇄 이동 처리
- **Test Strategy**:
  - 리플로우 시나리오 테스트
  - 성능 테스트

### [ ] **P2-06**: 드래그 앤 드롭 접근성
- **Title**: 키보드 네비게이션 지원
- **Description**: 드래그 앤 드롭을 키보드로 제어할 수 있는 접근성 기능
- **Status**: `TODO`
- **Dependencies**: P2-01, P2-04
- **Priority**: `P2 (Medium)`
- **Details**:
  - 키보드 이벤트 핸들러
  - 포커스 관리
  - ARIA 속성 추가
- **Test Strategy**:
  - 키보드 네비게이션 테스트
  - 스크린 리더 호환성 테스트

---

## 🎯 Phase 3: 위젯 라이브러리 개발 (Week 3-4)

### [ ] **P3-01**: 위젯 레지스트리 시스템
- **Title**: 위젯 동적 등록 및 관리 시스템
- **Description**: 위젯을 동적으로 등록하고 관리하는 레지스트리 구현
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P0 (Critical)`
- **Details**:
  - WidgetRegistry.ts 구현
  - 위젯 등록/해제 메서드
  - 위젯 메타데이터 관리
  - 카테고리별 분류
- **Test Strategy**:
  - 레지스트리 CRUD 테스트
  - 위젯 조회 테스트

### [ ] **P3-02**: 위젯 라이브러리 UI 컴포넌트
- **Title**: 위젯 선택 사이드바 UI
- **Description**: 편집 모드에서 위젯을 선택할 수 있는 사이드바 구현
- **Status**: `TODO`
- **Dependencies**: P3-01
- **Priority**: `P1 (High)`
- **Details**:
  - WidgetLibrary.tsx 구현
  - 카테고리별 탭
  - 위젯 프리뷰 카드
  - 검색 기능
- **Test Strategy**:
  - UI 렌더링 테스트
  - 인터랙션 테스트

### [ ] **P3-03**: 프로젝트 요약 위젯
- **Title**: 프로젝트 현황을 보여주는 위젯
- **Description**: 진행 중인 프로젝트 요약 정보를 표시하는 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P1 (High)`
- **Details**:
  - ProjectSummaryWidget.tsx 구현
  - 프로젝트 수, 진행률 표시
  - 최근 프로젝트 목록
  - 클릭 시 상세 페이지 이동
- **Test Strategy**:
  - 데이터 로딩 테스트
  - 렌더링 테스트
  - 인터랙션 테스트

### [ ] **P3-04**: 세무 캘린더 위젯
- **Title**: 세무 일정 관리 캘린더 위젯
- **Description**: 세무 관련 마감일과 일정을 표시하는 캘린더 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P1 (High)`
- **Details**:
  - TaxDeadlineWidget.tsx 구현
  - 월간/주간 뷰
  - 마감일 알림
  - 세무 이벤트 표시
- **Test Strategy**:
  - 캘린더 렌더링 테스트
  - 날짜 계산 테스트

### [ ] **P3-05**: 수익 차트 위젯
- **Title**: 매출/수익 시각화 차트 위젯
- **Description**: 월별/분기별 수익을 차트로 표시하는 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P1 (High)`
- **Details**:
  - RevenueChartWidget.tsx 구현
  - Chart.js 또는 Recharts 통합
  - 기간 선택 옵션
  - 데이터 필터링
- **Test Strategy**:
  - 차트 렌더링 테스트
  - 데이터 변환 테스트

### [ ] **P3-06**: 작업 추적기 위젯
- **Title**: 할 일 및 작업 관리 위젯
- **Description**: 프로젝트별 작업을 추적하고 관리하는 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P1 (High)`
- **Details**:
  - TaskTrackerWidget.tsx 구현
  - 작업 목록 표시
  - 우선순위별 정렬
  - 완료 상태 토글
- **Test Strategy**:
  - CRUD 기능 테스트
  - 상태 관리 테스트

### [ ] **P3-07**: KPI 메트릭 위젯
- **Title**: 핵심 성과 지표 대시보드 위젯
- **Description**: 주요 비즈니스 지표를 한눈에 보여주는 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P2 (Medium)`
- **Details**:
  - KPIWidget.tsx 구현
  - 지표 카드 레이아웃
  - 전월 대비 변화율
  - 목표 대비 달성률
- **Test Strategy**:
  - 데이터 계산 테스트
  - 렌더링 테스트

### [ ] **P3-08**: 세무 계산기 위젯
- **Title**: 간편 세금 계산 위젯
- **Description**: 부가세, 소득세 등을 간편하게 계산하는 위젯
- **Status**: `TODO`
- **Dependencies**: P1-06
- **Priority**: `P2 (Medium)`
- **Details**:
  - TaxCalculatorWidget.tsx 구현
  - 입력 폼
  - 실시간 계산
  - 결과 표시
- **Test Strategy**:
  - 계산 로직 테스트
  - 입력 검증 테스트

### [ ] **P3-09**: 위젯 설정 패널
- **Title**: 위젯별 설정 인터페이스
- **Description**: 각 위젯의 설정을 변경할 수 있는 패널
- **Status**: `TODO`
- **Dependencies**: P3-03, P3-04, P3-05
- **Priority**: `P2 (Medium)`
- **Details**:
  - WidgetConfigPanel.tsx 구현
  - 위젯별 설정 스키마
  - 폼 생성 및 검증
  - 설정 저장
- **Test Strategy**:
  - 설정 변경 테스트
  - 검증 로직 테스트

### [ ] **P3-10**: 위젯 Lazy Loading
- **Title**: 위젯 동적 로딩 시스템
- **Description**: 필요한 위젯만 동적으로 로드하는 최적화
- **Status**: `TODO`
- **Dependencies**: P3-01
- **Priority**: `P2 (Medium)`
- **Details**:
  - React.lazy 적용
  - Suspense 경계 설정
  - 로딩 스켈레톤
- **Test Strategy**:
  - 로딩 성능 테스트
  - 에러 경계 테스트

---

## 🎯 Phase 4: 템플릿 & 온보딩 (Week 5)

### [ ] **P4-01**: 온보딩 모달 컴포넌트
- **Title**: 첫 사용자를 위한 템플릿 선택 모달
- **Description**: 처음 접속한 사용자에게 템플릿을 선택하게 하는 모달
- **Status**: `TODO`
- **Dependencies**: P1-07
- **Priority**: `P1 (High)`
- **Details**:
  - OnboardingModal.tsx 구현
  - 템플릿 프리뷰
  - 선택 UI
  - Skip 옵션
- **Test Strategy**:
  - 모달 렌더링 테스트
  - 템플릿 선택 플로우 테스트

### [ ] **P4-02**: 프로젝트형 템플릿
- **Title**: 프로젝트 관리 최적화 템플릿
- **Description**: 프로젝트 중심 업무를 위한 위젯 배치 템플릿
- **Status**: `TODO`
- **Dependencies**: P3-03, P3-06
- **Priority**: `P1 (High)`
- **Details**:
  - projectTemplate.ts 생성
  - 프로젝트 관련 위젯 배치
  - 3×3 그리드 최적화
- **Test Strategy**:
  - 템플릿 적용 테스트
  - 위젯 배치 검증

### [ ] **P4-03**: 세무형 템플릿
- **Title**: 세무 업무 최적화 템플릿
- **Description**: 세무 중심 업무를 위한 위젯 배치 템플릿
- **Status**: `TODO`
- **Dependencies**: P3-04, P3-08
- **Priority**: `P1 (High)`
- **Details**:
  - taxTemplate.ts 생성
  - 세무 관련 위젯 배치
  - 우선순위별 배치
- **Test Strategy**:
  - 템플릿 적용 테스트
  - 위젯 호환성 테스트

### [ ] **P4-04**: 템플릿 적용 시스템
- **Title**: 템플릿을 레이아웃에 적용하는 로직
- **Description**: 선택된 템플릿을 현재 대시보드에 적용하는 시스템
- **Status**: `TODO`
- **Dependencies**: P4-02, P4-03
- **Priority**: `P1 (High)`
- **Details**:
  - applyTemplate 함수 구현
  - 기존 레이아웃 백업
  - 충돌 해결 로직
- **Test Strategy**:
  - 템플릿 적용 정확성 테스트
  - 롤백 기능 테스트

### [ ] **P4-05**: 첫 사용자 감지 로직
- **Title**: 신규 사용자 판별 시스템
- **Description**: 처음 접속한 사용자를 감지하고 온보딩으로 유도
- **Status**: `TODO`
- **Dependencies**: P4-01
- **Priority**: `P2 (Medium)`
- **Details**:
  - localStorage 체크
  - 사용자 플래그 관리
  - 온보딩 트리거
- **Test Strategy**:
  - 신규 사용자 감지 테스트
  - 기존 사용자 구분 테스트

### [ ] **P4-06**: 템플릿 관리 UI
- **Title**: 템플릿 전환 및 관리 인터페이스
- **Description**: 사용자가 템플릿을 변경하거나 관리할 수 있는 UI
- **Status**: `TODO`
- **Dependencies**: P4-02, P4-03, P4-04
- **Priority**: `P3 (Low)`
- **Details**:
  - 템플릿 목록 UI
  - 템플릿 전환 기능
  - 커스텀 템플릿 저장
- **Test Strategy**:
  - UI 렌더링 테스트
  - 템플릿 전환 테스트

---

## 🎯 Phase 5: 영속성 & 최적화 (Week 5)

### [ ] **P5-01**: Supabase 스키마 구현
- **Title**: 데이터베이스 테이블 및 관계 설정
- **Description**: 대시보드 레이아웃 저장을 위한 DB 스키마 구현
- **Status**: `TODO`
- **Dependencies**: None
- **Priority**: `P0 (Critical)`
- **Details**:
  - dashboard_layouts 테이블
  - dashboard_widgets 테이블
  - 인덱스 설정
  - RLS 정책
- **Test Strategy**:
  - 마이그레이션 테스트
  - CRUD 작업 테스트

### [ ] **P5-02**: 레이아웃 저장 서비스
- **Title**: 레이아웃 데이터 영속성 서비스
- **Description**: 대시보드 레이아웃을 Supabase에 저장하는 서비스
- **Status**: `TODO`
- **Dependencies**: P5-01
- **Priority**: `P0 (Critical)`
- **Details**:
  - layoutService.ts 구현
  - 저장/불러오기 메서드
  - 에러 핸들링
  - 재시도 로직
- **Test Strategy**:
  - API 호출 테스트
  - 에러 케이스 테스트

### [ ] **P5-03**: 자동 저장 기능
- **Title**: 변경사항 자동 저장 시스템
- **Description**: 레이아웃 변경 시 자동으로 저장하는 기능
- **Status**: `TODO`
- **Dependencies**: P5-02
- **Priority**: `P1 (High)`
- **Details**:
  - Debounced 저장
  - 저장 상태 표시
  - 충돌 해결
- **Test Strategy**:
  - 자동 저장 트리거 테스트
  - Debounce 타이밍 테스트

### [ ] **P5-04**: LocalStorage 백업
- **Title**: 오프라인 백업 시스템
- **Description**: 네트워크 실패 시를 대비한 로컬 저장소 백업
- **Status**: `TODO`
- **Dependencies**: P5-02
- **Priority**: `P2 (Medium)`
- **Details**:
  - localStorage 래퍼
  - 동기화 로직
  - 버전 관리
- **Test Strategy**:
  - 오프라인 시나리오 테스트
  - 동기화 테스트

### [ ] **P5-05**: 성능 최적화
- **Title**: 렌더링 및 상태 관리 최적화
- **Description**: React.memo, useMemo 등을 활용한 성능 개선
- **Status**: `TODO`
- **Dependencies**: P3-01, P3-02, P3-03
- **Priority**: `P1 (High)`
- **Details**:
  - 컴포넌트 메모이제이션
  - 불필요한 리렌더링 방지
  - 번들 크기 최적화
- **Test Strategy**:
  - 성능 프로파일링
  - 렌더링 횟수 측정

### [ ] **P5-06**: 반응형 그리드 시스템
- **Title**: 화면 크기별 그리드 자동 조정
- **Description**: 디바이스 크기에 따라 그리드를 자동으로 조정
- **Status**: `TODO`
- **Dependencies**: P1-02
- **Priority**: `P2 (Medium)`
- **Details**:
  - 미디어 쿼리 구현
  - 그리드 크기 자동 전환
  - 위젯 크기 조정
- **Test Strategy**:
  - 다양한 화면 크기 테스트
  - 브레이크포인트 테스트

---

## 🎯 Phase 6: 고급 기능 (Week 6)

### [ ] **P6-01**: 위젯 크기 조정 기능
- **Title**: 드래그로 위젯 크기 변경
- **Description**: 위젯의 모서리를 드래그하여 크기를 조정하는 기능
- **Status**: `TODO`
- **Dependencies**: P2-01, P2-02
- **Priority**: `P2 (Medium)`
- **Details**:
  - 리사이즈 핸들 구현
  - 최소/최대 크기 제약
  - 실시간 프리뷰
- **Test Strategy**:
  - 리사이즈 이벤트 테스트
  - 제약 조건 테스트

### [ ] **P6-02**: 키보드 단축키
- **Title**: 대시보드 제어 단축키
- **Description**: 키보드로 대시보드를 제어할 수 있는 단축키 시스템
- **Status**: `TODO`
- **Dependencies**: P1-05
- **Priority**: `P3 (Low)`
- **Details**:
  - 단축키 매핑
  - 편집 모드 토글 (Cmd+E)
  - 저장 (Cmd+S)
  - 실행 취소 (Cmd+Z)
- **Test Strategy**:
  - 키보드 이벤트 테스트
  - 단축키 충돌 테스트

### [ ] **P6-03**: 위젯 잠금 기능
- **Title**: 특정 위젯 이동/삭제 방지
- **Description**: 중요한 위젯을 잠궈서 실수로 변경되지 않도록 하는 기능
- **Status**: `TODO`
- **Dependencies**: P1-04
- **Priority**: `P3 (Low)`
- **Details**:
  - 잠금 상태 관리
  - 잠금 아이콘 표시
  - 잠금 토글 UI
- **Test Strategy**:
  - 잠금 상태 테스트
  - 이동/삭제 차단 테스트

### [ ] **P6-04**: 위젯 애니메이션
- **Title**: 부드러운 전환 애니메이션
- **Description**: 위젯 이동, 추가, 삭제 시 애니메이션 효과
- **Status**: `TODO`
- **Dependencies**: P2-04
- **Priority**: `P3 (Low)`
- **Details**:
  - Framer Motion 통합
  - 레이아웃 애니메이션
  - 드래그 애니메이션
- **Test Strategy**:
  - 애니메이션 트리거 테스트
  - 성능 영향 측정

### [ ] **P6-05**: 다중 레이아웃 지원
- **Title**: 여러 대시보드 레이아웃 관리
- **Description**: 사용자가 여러 레이아웃을 저장하고 전환할 수 있는 기능
- **Status**: `TODO`
- **Dependencies**: P5-02
- **Priority**: `P3 (Low)`
- **Details**:
  - 레이아웃 목록 관리
  - 레이아웃 전환 UI
  - 기본 레이아웃 설정
- **Test Strategy**:
  - 레이아웃 CRUD 테스트
  - 전환 기능 테스트

### [ ] **P6-06**: 위젯 내보내기/가져오기
- **Title**: 레이아웃 설정 내보내기 및 가져오기
- **Description**: 레이아웃을 JSON으로 내보내고 가져올 수 있는 기능
- **Status**: `TODO`
- **Dependencies**: P5-02
- **Priority**: `P3 (Low)`
- **Details**:
  - JSON 직렬화
  - 파일 다운로드/업로드
  - 유효성 검증
- **Test Strategy**:
  - 직렬화 테스트
  - 가져오기 검증 테스트

### [ ] **P6-07**: 위젯 공유 기능
- **Title**: 대시보드 레이아웃 공유
- **Description**: 다른 사용자와 레이아웃을 공유할 수 있는 기능
- **Status**: `TODO`
- **Dependencies**: P5-01, P5-02
- **Priority**: `P3 (Low)`
- **Details**:
  - 공유 링크 생성
  - 권한 관리
  - 템플릿 마켓플레이스
- **Test Strategy**:
  - 공유 링크 생성 테스트
  - 권한 검증 테스트

### [ ] **P6-08**: 전체 시스템 통합 테스트
- **Title**: E2E 테스트 및 최종 검증
- **Description**: 전체 시스템의 통합 테스트 및 품질 검증
- **Status**: `TODO`
- **Dependencies**: All previous tasks
- **Priority**: `P0 (Critical)`
- **Details**:
  - E2E 테스트 시나리오
  - 성능 벤치마크
  - 접근성 검증
  - 크로스 브라우저 테스트
- **Test Strategy**:
  - Playwright E2E 테스트
  - Lighthouse 성능 측정
  - WCAG 준수 검증

---

## 📊 태스크 통계

### Priority 분포
- **P0 (Critical)**: 10개 태스크
- **P1 (High)**: 15개 태스크
- **P2 (Medium)**: 10개 태스크
- **P3 (Low)**: 9개 태스크

### Phase별 작업량
- **Phase 1**: 8개 태스크 (기본 인프라)
- **Phase 2**: 6개 태스크 (드래그 앤 드롭)
- **Phase 3**: 10개 태스크 (위젯 라이브러리)
- **Phase 4**: 6개 태스크 (템플릿 & 온보딩)
- **Phase 5**: 6개 태스크 (영속성 & 최적화)
- **Phase 6**: 8개 태스크 (고급 기능)

### 종속성 체인
```
P1-01 → P1-02 → P2-01 → P2-04
     ↘ P1-03 → P1-07
     ↘ P1-06 → P3-01 → P3-02
```

---

## ✅ 완료 기준

### 각 Phase 완료 조건
- [ ] 모든 P0, P1 태스크 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] 통합 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서화 완료

### 프로젝트 완료 조건
- [ ] 모든 Phase 완료
- [ ] E2E 테스트 100% 통과
- [ ] 성능 목표 달성 (로드 시간 < 2초)
- [ ] 접근성 WCAG 2.1 AA 준수
- [ ] 프로덕션 배포 준비 완료

---

## 📚 참고 문서

### 개발 가이드
- **[대시보드 위젯 시스템 설계서](./dashboard-widget-system-design.md)**: 전체 아키텍처, 데이터 모델, 컴포넌트 구조, 코드 예시
- **기술 스택**: Next.js 14, TypeScript, @dnd-kit, Zustand, Tailwind CSS
- **데이터베이스**: Supabase 스키마 및 테이블 구조
- **UI/UX 가이드**: 드래그 앤 드롭 인터랙션, 온보딩 플로우

### 구현 참조
각 태스크 구현 시 설계 문서의 다음 섹션을 참고하세요:
- **시스템 아키텍처**: 전체 구조 및 기술 스택
- **데이터 모델**: TypeScript 인터페이스 및 타입 정의
- **드래그 앤 드롭 시스템**: 충돌 감지 알고리즘
- **위젯 개발 가이드**: BaseWidget 인터페이스 및 구현 패턴
- **성능 최적화**: React.memo, Lazy Loading 전략
- **데이터베이스 스키마**: Supabase 테이블 구조