# iOS 스타일 대시보드 Phase 2 테스트 가이드

## 📋 개요

Phase 2 Progressive Migration이 완료되었습니다. 이 가이드는 구현된 기능들을 테스트하는 방법을 설명합니다.

## 🚀 구현된 기능

### Phase 2.1: 점진적 위젯 마이그레이션
- `WidgetMigrationWrapper` 컴포넌트
- `BatchMigrator` 클래스
- iOS/Legacy 모드 자동 전환

### Phase 2.2: A/B 테스트 전략
- `ABTestService` 클래스
- 50/50 그룹 할당 시스템
- 8개 메트릭 추적

### Phase 2.3: 자동 롤백 메커니즘
- `RollbackMonitor` 클래스
- 5개 핵심 메트릭 실시간 모니터링
- 임계값 초과 시 자동 롤백

## 🧪 테스트 방법

### 1. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:3001/dashboard 접속

### 2. 브라우저 콘솔 열기

개발자 도구를 열고 Console 탭으로 이동 (F12 또는 Cmd+Option+I)

### 3. 디버그 도구 확인

```javascript
// 사용 가능한 명령어 확인
weaveDebug

// 현재 상태 확인
weaveDebug.showStatus()
```

## 📝 테스트 시나리오

### 시나리오 1: iOS 스타일 활성화/비활성화

```javascript
// iOS 스타일 활성화
weaveDebug.enableIOS()

// iOS 스타일 비활성화
weaveDebug.disableIOS()

// 토글
weaveDebug.toggleIOS()
```

### 시나리오 2: 위젯 마이그레이션 테스트

```javascript
// Batch 1 위젯 일괄 마이그레이션
weaveDebug.startMigration()

// 마이그레이션 상태 확인
weaveDebug.migrationStatus()

// 개별 위젯 마이그레이션
weaveDebug.migrateWidget('todo-list')
weaveDebug.migrateWidget('calendar-view')
weaveDebug.migrateWidget('kpi-metrics')
weaveDebug.migrateWidget('revenue-chart')
```

### 시나리오 3: A/B 테스트

```javascript
// Control 그룹 할당 (기존 대시보드)
weaveDebug.assignToABGroup('control')

// Treatment 그룹 할당 (iOS 스타일)
weaveDebug.assignToABGroup('treatment')

// A/B 테스트 결과 확인
weaveDebug.showABTestResults()

// 메트릭 추적 테스트
weaveDebug.trackABMetric('widget_interaction_rate', 0.85)
weaveDebug.trackABMetric('error_rate', 0.01)
weaveDebug.trackABMetric('performance_score', 95)
```

### 시나리오 4: 롤백 모니터 테스트

```javascript
// 모니터링 시작
weaveDebug.startMonitoring()

// 모니터 상태 확인
weaveDebug.showMonitorStatus()

// 수동 롤백 트리거 (테스트용)
weaveDebug.triggerManualRollback('테스트 롤백')

// 모니터링 중지
weaveDebug.stopMonitoring()
```

### 시나리오 5: 데이터 마이그레이션

```javascript
// 레거시 → iOS 데이터 마이그레이션
weaveDebug.migrateData()

// 현재 데이터 내보내기
const data = weaveDebug.exportData()

// 데이터 가져오기
weaveDebug.importData(data)

// 스토어 상태 확인
weaveDebug.showIOSStore()
weaveDebug.showLegacyStore()
```

## 🔍 검증 포인트

### 1. 위젯 렌더링 확인
- [ ] iOS 스타일에서 모든 위젯이 정상 표시되는가?
- [ ] Legacy 모드와 iOS 모드 전환이 원활한가?
- [ ] 위젯 드래그 앤 드롭이 작동하는가?

### 2. 데이터 일관성
- [ ] 모드 전환 시 데이터가 유지되는가?
- [ ] 위젯 설정이 보존되는가?
- [ ] 레이아웃 정보가 정확한가?

### 3. 성능
- [ ] 페이지 로드 시간이 적절한가?
- [ ] 위젯 렌더링이 부드러운가?
- [ ] 메모리 사용량이 안정적인가?

### 4. A/B 테스트
- [ ] 그룹 할당이 지속되는가?
- [ ] 메트릭이 정확히 추적되는가?
- [ ] 성공 기준이 올바르게 평가되는가?

### 5. 롤백 메커니즘
- [ ] 에러 감지가 작동하는가?
- [ ] 자동 롤백이 트리거되는가?
- [ ] 사용자 알림이 표시되는가?

## 🐛 알려진 이슈

1. **ESLint 경고**: 빌드 시 여러 ESLint 경고가 있지만 기능에는 영향 없음
2. **TaskTrackerWidget**: export 이름 불일치 경고 (추후 수정 예정)

## 📊 성공 기준

- ✅ 모든 Batch 1 위젯이 iOS 스타일에서 렌더링
- ✅ A/B 테스트 그룹 할당 및 추적 작동
- ✅ 롤백 모니터 에러 감지 및 자동 롤백
- ✅ 데이터 마이그레이션 성공
- ✅ 디버그 도구 모든 기능 작동

## 💡 추가 팁

### 빠른 테스트 실행

```javascript
// 한 번에 모든 기능 테스트
async function testAll() {
  console.log('1. iOS 활성화');
  weaveDebug.enableIOS();
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('2. 위젯 마이그레이션');
  await weaveDebug.startMigration();
  
  console.log('3. A/B 테스트 메트릭 추적');
  weaveDebug.trackABMetric('test_metric', Math.random());
  
  console.log('4. 모니터링 시작');
  weaveDebug.startMonitoring();
  
  console.log('5. 상태 확인');
  weaveDebug.showStatus();
  weaveDebug.showABTestResults();
  weaveDebug.showMonitorStatus();
}

// 실행
testAll()
```

### 문제 발생 시

```javascript
// 모든 설정 초기화
weaveDebug.resetFlags()
weaveDebug.resetStores()
weaveDebug.clearCache()

// 페이지 새로고침
window.location.reload()
```

## 📅 다음 단계

Phase 3: Optimization & Polish
- 성능 최적화
- UX 개선
- 모니터링 대시보드 구축

---

**작성일**: 2025-01-20  
**Phase 2 완료**: 85% 진행률  
**작성자**: Development Team