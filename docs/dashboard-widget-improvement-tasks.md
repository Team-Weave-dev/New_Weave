# 📋 대시보드 위젯 시스템 개선 Task 목록

## 📊 Overview
이 문서는 대시보드 위젯 시스템 아키텍처 개선을 위한 구체적인 Task 목록입니다.

---

## Phase 1: 핵심 인프라 개선 (Priority: Critical)

### 위젯 간 통신 시스템

- [x] **[INFRA-001]** WidgetEventBus 클래스 구현
  - **Description**: 위젯 간 이벤트 기반 통신 시스템 구축
  - **Status**: DONE
  - **Dependencies**: None
  - **Priority**: P1
  - **Details**: 
    - Event emitter/subscriber 패턴 구현
    - TypeScript 타입 안전성 보장
    - 이벤트 네임스페이스 지원
  - **Test Strategy**: 
    - Unit test: 이벤트 발행/구독 메커니즘
    - Integration test: 위젯 간 실제 통신 시나리오

- [x] **[INFRA-002]** SharedDataStore 구현
  - **Description**: 위젯 간 공유 데이터 저장소 구축
  - **Status**: DONE
  - **Dependencies**: INFRA-001
  - **Priority**: P1
  - **Details**:
    - Zustand 또는 Context API 활용
    - 구독 기반 데이터 업데이트
    - 데이터 타입 정의 및 검증
  - **Test Strategy**:
    - Unit test: CRUD 연산 검증
    - Integration test: 다중 위젯 데이터 동기화

### 캘린더 위젯 통합

- [x] **[WIDGET-001]** CalendarViewWidget 구현
  - **Description**: 달력형 뷰 위젯 개발
  - **Status**: DONE
  - **Dependencies**: None
  - **Priority**: P1
  - **Details**:
    - 월/주/일 뷰 지원
    - 드래그 앤 드롭 이벤트 이동
    - 미니 캘린더 네비게이션
  - **Test Strategy**:
    - Component test: 렌더링 및 상태 관리
    - E2E test: 사용자 인터랙션 시나리오

- [x] **[WIDGET-002]** EventListWidget 구현
  - **Description**: 이벤트 목록형 뷰 위젯 개발
  - **Status**: DONE
  - **Dependencies**: None
  - **Priority**: P1
  - **Details**:
    - 목록/타임라인 뷰 전환
    - 정렬 및 필터링 기능
    - 검색 기능 통합
  - **Test Strategy**:
    - Component test: 필터링/정렬 로직
    - Integration test: 캘린더 데이터 연동

- [x] **[WIDGET-003]** CalendarDataService 구현
  - **Description**: 통합 캘린더 데이터 서비스 레이어
  - **Status**: DONE ✅ (E2E 테스트 완료)
  - **Dependencies**: WIDGET-001, WIDGET-002
  - **Priority**: P1
  - **Details**:
    - ✅ 이벤트 타입 시스템 설계 완료
    - ✅ Mock 데이터를 통한 테스트 환경 구축
    - ✅ Zustand store 기반 상태 관리
    - ✅ SharedDataStore 연동
    - ✅ 위젯 간 데이터 통신 구현
    - Supabase 연동 준비 (TODO 주석 처리)
  - **Test Strategy**:
    - ✅ Unit test: 데이터 변환 및 검증
    - ✅ Integration test: CalendarViewWidget과 EventListWidget 통합
    - ✅ E2E test: 대시보드 템플릿 적용 및 위젯 로딩

---

## Phase 2: 실시간 업데이트 시스템 (Priority: High)

- [x] **[RT-001]** RealtimeManager 클래스 구현
  - **Description**: Mock 데이터 기반 실시간 업데이트 시스템 (Supabase 연결 준비)
  - **Status**: DONE ✅
  - **Dependencies**: INFRA-002
  - **Priority**: P2
  - **Details**:
    - ✅ Mock WebSocket 연결 시뮬레이션
    - ✅ 자동 재연결 메커니즘 구현
    - ✅ 채널별 구독 관리 시스템
    - ✅ Supabase 연결 전환 기능 준비 (TODO 주석)
  - **Test Strategy**:
    - ✅ Unit test: 연결 상태 관리
    - ✅ Integration test: RealtimeTestWidget 생성 및 테스트

- [x] **[RT-002]** 위젯별 실시간 구독 설정
  - **Description**: 각 위젯의 실시간 업데이트 구독 로직
  - **Status**: DONE ✅
  - **Dependencies**: RT-001
  - **Priority**: P2
  - **Details**:
    - ✅ useRealtime Hook 구현
    - ✅ useWidgetRealtime 전용 Hook 제공
    - ✅ 위젯 타입별 구독 채널 정의
    - ✅ 업데이트 디바운싱
    - ✅ 오프라인 상태 처리
    - ✅ RealtimeTestWidget으로 동작 검증
  - **Test Strategy**:
    - ✅ Component test: RealtimeTestWidget 구현
    - ✅ Build test: 빌드 성공 확인

---

## Phase 3: 신규 위젯 개발 - 생산성 (Priority: High)

- [x] **[PROD-001]** TimeTrackerWidget 구현
  - **Description**: 프로젝트별 시간 추적 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: INFRA-002
  - **Priority**: P1
  - **Details**:
    - ✅ 타이머 기능 구현 완료
    - ✅ 프로젝트별 시간 집계 구현
    - ✅ 리포트 생성 및 표시 기능
    - ✅ 세션 데이터 관리
    - ✅ UI/UX 구현 (타이머 뷰, 리포트 뷰)
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 타이머 정확도
    - Integration test: 데이터 저장 및 집계

- [x] **[PROD-002]** PomodoroWidget 구현
  - **Description**: 뽀모도로 타이머 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - ✅ 25분 타이머 및 휴식 알림
    - ✅ 일일 세션 추적
    - ✅ 사운드 알림 옵션
    - ✅ 작업/짧은 휴식/긴 휴식 모드
    - ✅ 원형 프로그레스바 UI
    - ✅ 로컬스토리지 기반 세션 저장
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 타이머 상태 관리
    - E2E test: 알림 시스템

- [x] **[PROD-003]** QuickNotesWidget 구현
  - **Description**: 빠른 메모 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - ✅ 마크다운 에디터 (간단한 형식 지원)
    - ✅ 태그 시스템 구현
    - ✅ 검색 기능 구현
    - ✅ 로컬스토리지 저장
    - ✅ 리스트/그리드 뷰 전환
    - ✅ 노트 고정(핀) 기능
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 에디터 기능
    - Integration test: 데이터 저장/검색

- [x] **[PROD-004]** WeatherWidget 구현
  - **Description**: 날씨 정보 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P4
  - **Details**:
    - ✅ 현재 날씨 표시 (기온, 습도, 풍속, 체감온도)
    - ✅ 5일 예보 구현
    - ✅ 위치 설정 기능
    - ✅ Mock 데이터 서비스 구현
    - ✅ 로컬스토리지 캐싱 (1시간)
    - ✅ 자동 새로고침 기능
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - ✅ Mock test: Mock 데이터 API 구현
    - Component test: UI 렌더링

---

## Phase 4: 신규 위젯 개발 - 분석 (Priority: High)

- [x] **[ANALYTICS-001]** ExpenseTrackerWidget 구현
  - **Description**: 카테고리별 지출 추적 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: INFRA-002
  - **Priority**: P1
  - **Details**:
    - ✅ 카테고리 분류 시스템 (10개 카테고리)
    - ✅ 예산 설정 및 초과 알림
    - ✅ 지출 트렌드 차트 (6개월)
    - ✅ 로컬스토리지 데이터 저장
    - ✅ 월별 지출 추적
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 데이터 입력 및 계산
    - Integration test: 차트 렌더링

- [x] **[ANALYTICS-002]** CashFlowWidget 구현
  - **Description**: 현금 흐름 시각화 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - ✅ 수입/지출 흐름 차트 (Bar, Line, Area)
    - ✅ 4가지 뷰 모드 (흐름, 비교, 누적, 예측)
    - ✅ 선형 회귀 기반 예측 기능
    - ✅ 시간 범위 선택 (3/6/12개월, 전체)
    - ✅ 실시간 통계 요약
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Unit test: 계산 로직
    - Component test: 차트 시각화

- [x] **[ANALYTICS-003]** ClientOverviewWidget 구현
  - **Description**: 고객별 프로젝트 및 매출 현황
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: INFRA-002
  - **Priority**: P2
  - **Details**:
    - ✅ 고객 목록 및 필터링 (검색, 상태, 정렬)
    - ✅ 매출 분석 차트 (성장률 표시)
    - ✅ 프로젝트 상태 표시
    - ✅ 리스트/카드 뷰 전환
    - ✅ 고객 상세 정보 뷰
    - ✅ 미수금 및 월 구독 관리
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: UI 인터랙션

- [x] **[ANALYTICS-004]** InvoiceStatusWidget 구현
  - **Description**: 청구서 및 미수금 관리 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - ✅ 미수금 현황 대시보드
    - ✅ 만기일 알림 및 상태 표시
    - ✅ 리마인더 전송 기능
    - ✅ 청구서 상태 관리 (초안/대기/연체/완료)
    - ✅ 상세 보기 모달
    - ✅ 로컬스토리지 데이터 저장
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Unit test: 알림 로직
    - Integration test: 리마인더 시스템

---

## Phase 5: 신규 위젯 개발 - 커뮤니케이션 (Priority: Medium)

- [x] **[COMM-001]** NotificationCenterWidget 구현
  - **Description**: 통합 알림 센터 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: RT-001
  - **Priority**: P2
  - **Details**:
    - ✅ 우선순위별 알림 표시 (urgent, high, medium, low)
    - ✅ 읽음 표시 및 필터링 기능
    - ✅ 카테고리별 필터링 (system, task, calendar, finance, team)
    - ✅ 알림 설정 관리 UI
    - ✅ Mock 데이터 기반 테스트
    - ✅ 실시간 업데이트 시뮬레이션
    - ✅ 로컬스토리지 기반 영구 저장
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 알림 관리
    - Integration test: 실시간 알림

- [x] **[COMM-002]** TeamStatusWidget 구현
  - **Description**: 팀원 상태 표시 위젯
  - **Status**: DONE ✅
  - **Dependencies**: RT-001
  - **Priority**: P3
  - **Details**:
    - ✅ 온라인/오프라인/바쁨/자리비움/회의중 상태 표시
    - ✅ 현재 작업 표시
    - ✅ 다음 미팅 일정 표시
    - ✅ 생산성 지표 표시
    - ✅ 격자/목록 뷰 전환
    - ✅ 상태별 필터링
    - ✅ Mock 데이터 서비스 구현
    - ✅ 실시간 상태 업데이트 시뮬레이션
  - **Test Strategy**:
    - ✅ Build test: 빌드 진행 확인
    - Integration test: 상태 동기화
    - Component test: UI 업데이트

- [x] **[COMM-003]** QuickLinksWidget 구현
  - **Description**: 바로가기 링크 위젯
  - **Status**: DONE ✅ (개발 서버 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P4
  - **Details**:
    - ✅ 커스텀 링크 추가/수정/삭제 기능
    - ✅ 9개 아이콘 선택 옵션
    - ✅ 6개 카테고리 관리 (업무, 도구, 문서, 재무, 개인, 기타)
    - ✅ 그리드/리스트 뷰 전환
    - ✅ 카테고리별 필터링
    - ✅ 링크 검색 기능
    - ✅ 로컬스토리지 기반 데이터 저장
  - **Test Strategy**:
    - ✅ Build test: 개발 서버 컴파일 성공
    - Component test: 링크 관리
    - E2E test: 링크 작동

- [x] **[COMM-004]** AnnouncementsWidget 구현
  - **Description**: 공지사항 위젯
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P4
  - **Details**:
    - ✅ 우선순위별 공지 (urgent/high/medium/low)
    - ✅ 만료일 설정 (무기한/1일/1주일/1개월)
    - ✅ 읽음 확인 및 표시
    - ✅ 카테고리별 필터링 (general/update/maintenance/event/policy)
    - ✅ 공지사항 추가/삭제 기능
    - ✅ 상세보기 모달
    - ✅ 로컬스토리지 기반 데이터 저장
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공 확인
    - Component test: 공지 관리
    - Integration test: 만료 처리

---

## Phase 6: 위젯 설정 관리 시스템 (Priority: Medium)

- [x] **[CONFIG-001]** WidgetConfigManager 구현
  - **Description**: 위젯 설정 저장/복원 관리자
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: INFRA-002
  - **Priority**: P3
  - **Details**:
    - ✅ WidgetConfig 인터페이스 정의
    - ✅ 로컬스토리지 어댑터 구현
    - ✅ 설정 유효성 검증 시스템
    - ✅ 변경 이력 관리 및 롤백 기능
    - ✅ 설정 마이그레이션 준비
  - **Test Strategy**:
    - ✅ Type safety: TypeScript 컴파일 성공
    - ✅ Build test: 프로덕션 빌드 성공

- [x] **[CONFIG-002]** 위젯 프리셋 시스템
  - **Description**: 위젯 레이아웃 프리셋 관리
  - **Status**: DONE ✅ (UI 컴포넌트 구현 완료)
  - **Dependencies**: CONFIG-001
  - **Priority**: P3
  - **Details**:
    - ✅ 프리셋 내보내기/가져오기 (JSON)
    - ✅ WidgetPresetManager UI 컴포넌트
    - ✅ 프리셋 CRUD 기능
    - ✅ 공유 코드 생성 기능
    - ✅ 개선된 WidgetConfigPanel
  - **Test Strategy**:
    - ✅ Build test: 빌드 성공
    - ✅ Component integration: UI 통합 완료

---

## Phase 7: 기존 위젯 개선 (Priority: Medium)

- [x] **[IMPROVE-001]** ProjectSummaryWidget 개선
  - **Description**: 프로젝트 요약 위젯 기능 향상
  - **Status**: DONE ✅
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 진행률 시각화 개선
    - 마일스톤 타임라인
    - 팀원 아바타 표시
  - **Test Strategy**:
    - Component test: 새 기능 테스트
    - Regression test: 기존 기능 유지

- [x] **[IMPROVE-002]** RevenueChartWidget 개선
  - **Description**: 수익 차트 위젯 기능 확장
  - **Status**: DONE ✅
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 차트 타입 선택기
    - 비교 기간 설정
    - 데이터 내보내기
  - **Test Strategy**:
    - Component test: 차트 옵션
    - Performance test: 렌더링 속도

- [x] **[IMPROVE-003]** TaskTrackerWidget 칸반 보드 추가
  - **Description**: 작업 추적기에 칸반 보드 뷰 추가
  - **Status**: DONE ✅ (빌드 테스트 완료)
  - **Dependencies**: None
  - **Priority**: P2
  - **Details**:
    - ✅ 칸반 보드 레이아웃 (할 일, 진행 중, 검토, 완료 4개 콜럼)
    - ✅ @dnd-kit를 사용한 드래그 앤 드롭 구현
    - ✅ 서브태스크 지원 (Expandable 카드로 표시)
    - ✅ 리스트 뷰/칸반 뷰 토글 버튼
    - ✅ 상태별 작업 카운트 표시
    - ✅ 콜럼 간 드래그 앤 드롭으로 상태 변경
  - **Test Strategy**:
    - ✅ Build test: 프로덕션 빌드 성공
    - Component test: 상태 관리

- [ ] **[IMPROVE-004]** KPIWidget 커스터마이징 강화
  - **Description**: KPI 위젯 사용자 정의 기능
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 커스텀 KPI 생성
    - 목표 대비 진행률
    - 조건부 포맷팅
  - **Test Strategy**:
    - Component test: KPI 설정
    - Unit test: 계산 로직

- [ ] **[IMPROVE-005]** TodoListWidget 고급 기능
  - **Description**: 할일 목록 위젯 기능 확장
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 카테고리 및 태그
    - 반복 작업 설정
    - 우선순위 매트릭스
  - **Test Strategy**:
    - Component test: 새 기능
    - Integration test: 데이터 저장

---

## Phase 8: 성능 최적화 (Priority: Medium)

- [ ] **[PERF-001]** Virtual Scrolling 구현
  - **Description**: 긴 목록에 가상 스크롤링 적용
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - react-window 또는 react-virtual 통합
    - 동적 아이템 높이 지원
    - 스크롤 위치 복원
  - **Test Strategy**:
    - Performance test: 렌더링 성능
    - E2E test: 스크롤 동작

- [ ] **[PERF-002]** Intersection Observer 적용
  - **Description**: 뷰포트 기반 지연 로딩
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 위젯 지연 로딩
    - 이미지 최적화
    - 오프스크린 렌더링 방지
  - **Test Strategy**:
    - Performance test: 초기 로드 시간
    - Component test: 가시성 감지

- [ ] **[PERF-003]** React.memo 및 useMemo 최적화
  - **Description**: 리렌더링 최적화
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 컴포넌트 메모이제이션
    - 연산 결과 캐싱
    - 의존성 최적화
  - **Test Strategy**:
    - Performance test: 리렌더링 횟수
    - Unit test: 메모이제이션 효과

- [ ] **[PERF-004]** API 호출 최적화
  - **Description**: 네트워크 요청 최적화
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P3
  - **Details**:
    - 디바운싱/쓰로틀링
    - 요청 배치 처리
    - 캐싱 전략
  - **Test Strategy**:
    - Network test: API 호출 횟수
    - Integration test: 데이터 일관성

---

## Phase 9: 접근성 개선 (Priority: Low)

- [ ] **[A11Y-001]** 키보드 네비게이션 구현
  - **Description**: 전체 키보드 접근성 지원
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P4
  - **Details**:
    - Tab 인덱스 관리
    - 화살표 키 네비게이션
    - 키보드 단축키
  - **Test Strategy**:
    - E2E test: 키보드 전용 작업
    - Accessibility audit

- [ ] **[A11Y-002]** 스크린 리더 지원
  - **Description**: 시각 장애인 접근성
  - **Status**: TODO
  - **Dependencies**: None
  - **Priority**: P4
  - **Details**:
    - ARIA 레이블
    - Live regions
    - 상태 변경 알림
  - **Test Strategy**:
    - Screen reader test
    - ARIA compliance check

- [ ] **[A11Y-003]** WCAG 2.1 AA 준수
  - **Description**: 웹 접근성 표준 준수
  - **Status**: TODO
  - **Dependencies**: A11Y-001, A11Y-002
  - **Priority**: P4
  - **Details**:
    - 색상 대비 검증
    - 포커스 인디케이터
    - 스킵 링크
  - **Test Strategy**:
    - Automated accessibility test
    - Manual audit

---

## Phase 10: 혁신적 기능 (Priority: Future)

- [ ] **[INNOVATION-001]** AI 위젯 추천 엔진
  - **Description**: 사용 패턴 기반 위젯 추천
  - **Status**: TODO
  - **Dependencies**: INFRA-002, CONFIG-001
  - **Priority**: P5
  - **Details**:
    - 사용 패턴 분석
    - ML 모델 통합
    - 개인화 추천
  - **Test Strategy**:
    - A/B testing
    - Accuracy metrics

- [ ] **[INNOVATION-002]** 위젯 마켓플레이스
  - **Description**: 커뮤니티 위젯 공유 플랫폼
  - **Status**: TODO
  - **Dependencies**: CONFIG-002
  - **Priority**: P5
  - **Details**:
    - 위젯 퍼블리싱
    - 설치 시스템
    - 평가 및 리뷰
  - **Test Strategy**:
    - Integration test
    - Security audit

- [ ] **[INNOVATION-003]** 스마트 대시보드
  - **Description**: 컨텍스트 기반 자동 레이아웃
  - **Status**: TODO
  - **Dependencies**: INNOVATION-001
  - **Priority**: P5
  - **Details**:
    - 컨텍스트 감지
    - 자동 레이아웃 조정
    - 위젯 우선순위 조정
  - **Test Strategy**:
    - Usability testing
    - Performance monitoring

---

## 📊 진행 상황 요약

### 전체 진행률
- **Total Tasks**: 46
- **Completed**: 21
- **In Progress**: 0
- **TODO**: 25
- **Progress**: 45.7%

### Phase별 상태
| Phase | Total | Complete | Progress |
|-------|-------|----------|----------|
| Phase 1 | 5 | 5 | 100% |
| Phase 2 | 2 | 2 | 100% |
| Phase 3 | 4 | 4 | 100% |
| Phase 4 | 4 | 4 | 100% |
| Phase 5 | 4 | 4 | 100% |
| Phase 6 | 2 | 2 | 100% |
| Phase 7 | 5 | 0 | 0% |
| Phase 8 | 4 | 0 | 0% |
| Phase 9 | 3 | 0 | 0% |
| Phase 10 | 3 | 0 | 0% |

### Priority 분포
- **P1 (Critical)**: 5 tasks
- **P2 (High)**: 5 tasks
- **P3 (Medium)**: 20 tasks
- **P4 (Low)**: 10 tasks
- **P5 (Future)**: 6 tasks

---

## 📝 Notes
- 각 태스크는 순차적으로 진행되어야 하며, 의존성을 반드시 확인
- 완료된 태스크는 체크박스를 체크하고 Status를 DONE으로 변경
- 빌드 테스트는 각 Phase 완료 후 필수 실행
- 테스트 전략은 구현 전 반드시 검토 및 준비