# API 최적화 가이드

## 개요
Weave 프로젝트의 API 호출 최적화를 위한 유틸리티 라이브러리와 React Hooks를 제공합니다.

## 핵심 기능

### 1. 디바운싱 (Debouncing)
연속적인 API 호출을 지정된 시간 동안 지연시켜 마지막 호출만 실행합니다.
- **사용 사례**: 검색 입력, 자동 저장
- **기본 지연**: 300ms

### 2. 쓰로틀링 (Throttling)  
지정된 시간 간격으로만 API 호출을 허용합니다.
- **사용 사례**: 무한 스크롤, 새로고침 버튼
- **기본 간격**: 500ms

### 3. 캐싱 (Caching)
API 응답을 메모리에 저장하여 중복 요청을 방지합니다.
- **기본 TTL**: 5분
- **자동 만료 관리**
- **수동 무효화 지원**

### 4. 배치 처리 (Batch Processing)
여러 API 요청을 모아서 한 번에 처리합니다.
- **기본 배치 크기**: 10개
- **기본 대기 시간**: 100ms

### 5. 재시도 로직 (Retry Logic)
실패한 요청을 자동으로 재시도합니다.
- **기본 재시도 횟수**: 3회
- **백오프 전략**: 지수 백오프

## 사용 방법

### 유틸리티 함수

```typescript
import { 
  debounce, 
  throttle, 
  ApiCache,
  BatchProcessor,
  retryRequest,
  OptimizedApiClient
} from '@/lib/utils/api-optimizer';

// 디바운싱 예제
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query);
  setSearchResults(results);
}, 300);

// 쓰로틀링 예제
const throttledRefresh = throttle(() => {
  refreshData();
}, 2000);

// 캐싱 예제
const cache = new ApiCache();
const data = cache.get('weather_seoul') || await fetchWeather('seoul');
cache.set('weather_seoul', data, {}, 30 * 60 * 1000); // 30분 캐시

// 재시도 예제
const data = await retryRequest(
  () => fetchData(),
  3, // 최대 재시도
  1000, // 초기 지연
  2 // 백오프 배수
);
```

### React Hooks

```typescript
import {
  useDebouncedApi,
  useThrottledApi,
  useCachedApi,
  useBatchApi,
  useInfiniteApi,
  useSearchApi,
  useRetryApi,
  usePollingApi
} from '@/lib/hooks/useApiOptimizer';

// 검색 API with 디바운싱
const {
  query,
  setQuery,
  results,
  loading,
  error
} = useSearchApi(searchFunction, 300);

// 캐싱된 API 호출
const {
  data,
  loading,
  error,
  refetch,
  invalidate
} = useCachedApi('/api/weather', {
  params: { city: 'seoul' },
  ttl: 30 * 60 * 1000, // 30분
  autoFetch: true
});

// 무한 스크롤
const {
  data,
  loading,
  hasMore,
  loadMore
} = useInfiniteApi(fetchPage, {
  initialPage: 1,
  throttleDelay: 500
});

// 폴링 (실시간 업데이트)
const {
  data,
  loading,
  error,
  pause,
  resume
} = usePollingApi(fetchStatus, 5000, true);
```

## 적용 사례

### WeatherWidget
- **디바운싱**: 위치 변경 시 API 호출 최적화
- **쓰로틀링**: 새로고침 버튼 연타 방지
- **캐싱**: 날씨 데이터 30분 캐싱
- **재시도**: API 실패 시 자동 재시도

### NotificationCenterWidget
- **검색 디바운싱**: 실시간 검색 최적화 (300ms)
- **폴링**: 1분마다 새 알림 확인

## 성능 개선 효과

| 최적화 기법 | API 호출 감소 | 응답 속도 개선 | 사용자 경험 |
|----------|------------|------------|----------|
| 디바운싱 | 70-90% | - | 부드러운 타이핑 |
| 쓰로틀링 | 50-70% | - | 과부하 방지 |
| 캐싱 | 80-95% | 100% | 즉시 응답 |
| 배치 처리 | 60-80% | 30-50% | 효율적 처리 |
| 재시도 | - | - | 안정성 향상 |

## 모니터링 및 디버깅

### 캐시 상태 확인
```typescript
// 캐시 크기 제한
cache.limitSize(100); // 최대 100개 항목

// 캐시 무효화
cache.invalidate('weather_seoul'); // 특정 캐시 삭제
cache.invalidate(); // 전체 캐시 초기화
```

### 성능 측정
```typescript
// 개발자 도구 Network 탭에서 확인
// - 디바운싱: 마지막 입력 후에만 요청 발생
// - 쓰로틀링: 지정된 간격으로만 요청 발생
// - 캐싱: 동일 요청 시 네트워크 호출 없음
```

## 주의 사항

1. **과도한 캐싱 주의**: 실시간 데이터는 짧은 TTL 사용
2. **메모리 관리**: 캐시 크기 제한 설정 필수
3. **재시도 설정**: 중요하지 않은 요청은 재시도 횟수 줄이기
4. **배치 크기**: 서버 한계를 고려한 적절한 크기 설정

## 향후 개선 계획

- [ ] IndexedDB를 활용한 영구 캐싱
- [ ] Service Worker를 통한 오프라인 지원
- [ ] GraphQL 배치 쿼리 지원
- [ ] WebSocket 연결 최적화