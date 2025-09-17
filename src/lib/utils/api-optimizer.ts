/**
 * API 호출 최적화 유틸리티
 * - 디바운싱/쓰로틀링
 * - 요청 배치 처리
 * - 캐싱 전략
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

type BatchRequest<T> = {
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

/**
 * 디바운스 함수
 * 지정된 시간 동안 연속 호출을 지연시킴
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 쓰로틀 함수
 * 지정된 시간 간격으로만 함수 실행
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastThis = this;
    }
  };
}

/**
 * API 캐시 매니저
 */
export class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5분

  /**
   * 캐시 키 생성
   */
  private getCacheKey(url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  /**
   * 캐시 데이터 가져오기
   */
  get<T>(url: string, params?: any): T | null {
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(url: string, data: T, params?: any, ttl?: number): void {
    const key = this.getCacheKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * 캐시 무효화
   */
  invalidate(url?: string, params?: any): void {
    if (url) {
      const key = this.getCacheKey(url, params);
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 캐시 크기 제한
   */
  limitSize(maxSize: number): void {
    if (this.cache.size <= maxSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, this.cache.size - maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }
}

/**
 * 요청 배치 처리기
 */
export class BatchProcessor<T> {
  private queue: BatchRequest<T>[] = [];
  private batchSize: number;
  private batchDelay: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private batchHandler: (requests: (() => Promise<T>)[]) => Promise<T[]>;

  constructor(
    batchHandler: (requests: (() => Promise<T>)[]) => Promise<T[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.batchHandler = batchHandler;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * 요청 추가
   */
  add(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else {
        this.scheduleProcessing();
      }
    });
  }

  /**
   * 배치 처리 예약
   */
  private scheduleProcessing(): void {
    if (this.timeoutId) return;

    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * 배치 처리 실행
   */
  private async processBatch(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const requests = batch.map(item => item.request);

    try {
      const results = await this.batchHandler(requests);
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }

    // 남은 요청이 있으면 계속 처리
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }
}

/**
 * 재시도 로직
 */
export async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoff;
      }
    }
  }

  throw lastError;
}

/**
 * API 클라이언트 래퍼
 */
export class OptimizedApiClient {
  private cache: ApiCache;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.cache = new ApiCache();
  }

  /**
   * 캐싱이 적용된 GET 요청
   */
  async get<T>(
    url: string,
    options?: {
      params?: any;
      cache?: boolean;
      ttl?: number;
    }
  ): Promise<T> {
    const cacheKey = this.cache['getCacheKey'](url, options?.params);

    // 캐시 확인
    if (options?.cache !== false) {
      const cached = this.cache.get<T>(url, options?.params);
      if (cached) return cached;
    }

    // 중복 요청 방지
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const request = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        // 캐시 저장
        if (options?.cache !== false) {
          this.cache.set(url, data, options?.params, options?.ttl);
        }
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, request);
    return request;
  }

  /**
   * POST 요청
   */
  async post<T>(
    url: string,
    data: any,
    options?: {
      retry?: boolean;
      maxRetries?: number;
    }
  ): Promise<T> {
    const request = () =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      });

    if (options?.retry !== false) {
      return retryRequest(request, options?.maxRetries);
    }

    return request();
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(url?: string, params?: any): void {
    this.cache.invalidate(url, params);
  }
}

/**
 * 검색 최적화를 위한 디바운스된 검색 훅
 */
export function createDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const debouncedSearch = debounce(searchFunction, delay);
  return debouncedSearch;
}

/**
 * 무한 스크롤을 위한 쓰로틀된 로드 함수
 */
export function createThrottledLoader<T>(
  loadFunction: (page: number) => Promise<T>,
  limit: number = 500
) {
  const throttledLoad = throttle(loadFunction, limit);
  return throttledLoad;
}

// Export default instance
export const apiClient = new OptimizedApiClient();