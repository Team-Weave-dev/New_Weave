/**
 * API 최적화를 위한 React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  debounce, 
  throttle, 
  ApiCache, 
  BatchProcessor,
  OptimizedApiClient,
  retryRequest
} from '@/lib/utils/api-optimizer';

/**
 * 디바운스된 API 호출 Hook
 */
export function useDebouncedApi<T>(
  apiCall: (params: any) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedApiCall = useCallback(
    debounce(async (params: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiCall(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, delay),
    [apiCall, delay]
  );

  return {
    call: debouncedApiCall,
    data,
    loading,
    error,
  };
}

/**
 * 쓰로틀된 API 호출 Hook
 */
export function useThrottledApi<T>(
  apiCall: (params: any) => Promise<T>,
  limit: number = 500
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const throttledApiCall = useCallback(
    throttle(async (params: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiCall(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, limit),
    [apiCall, limit]
  );

  return {
    call: throttledApiCall,
    data,
    loading,
    error,
  };
}

/**
 * 캐싱된 API 호출 Hook
 */
export function useCachedApi<T>(
  url: string,
  options?: {
    params?: any;
    ttl?: number;
    autoFetch?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(new ApiCache());
  const clientRef = useRef(new OptimizedApiClient());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await clientRef.current.get<T>(url, {
        params: options?.params,
        ttl: options?.ttl,
      });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, options?.params, options?.ttl]);

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options?.autoFetch]);

  const invalidate = useCallback(() => {
    clientRef.current.invalidateCache(url, options?.params);
    fetchData();
  }, [url, options?.params, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
}

/**
 * 배치 처리 API Hook
 */
export function useBatchApi<T>(
  batchHandler: (requests: (() => Promise<T>)[]) => Promise<T[]>,
  batchSize: number = 10,
  batchDelay: number = 100
) {
  const processorRef = useRef(
    new BatchProcessor<T>(batchHandler, batchSize, batchDelay)
  );

  const addRequest = useCallback((request: () => Promise<T>) => {
    return processorRef.current.add(request);
  }, []);

  return {
    addRequest,
  };
}

/**
 * 무한 스크롤 API Hook
 */
export function useInfiniteApi<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options?: {
    initialPage?: number;
    throttleDelay?: number;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(options?.initialPage || 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(
    throttle(async () => {
      if (loading || !hasMore) return;

      setLoading(true);
      setError(null);
      try {
        const result = await fetchPage(page);
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.hasMore);
        setPage(prev => prev + 1);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, options?.throttleDelay || 500),
    [page, loading, hasMore, fetchPage, options?.throttleDelay]
  );

  const reset = useCallback(() => {
    setData([]);
    setPage(options?.initialPage || 1);
    setHasMore(true);
    setError(null);
  }, [options?.initialPage]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

/**
 * 검색 API Hook with 디바운싱
 */
export function useSearchApi<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await searchFunction(searchQuery);
        setResults(data);
      } catch (err) {
        setError(err as Error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFunction, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}

/**
 * 재시도가 가능한 API Hook
 */
export function useRetryApi<T>(
  apiCall: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    autoFetch?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    try {
      const result = await retryRequest(
        apiCall,
        options?.maxRetries || 3,
        options?.delay || 1000,
        options?.backoff || 2
      );
      setData(result);
    } catch (err) {
      setError(err as Error);
      setRetryCount(options?.maxRetries || 3);
    } finally {
      setLoading(false);
    }
  }, [apiCall, options?.maxRetries, options?.delay, options?.backoff]);

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options?.autoFetch]);

  return {
    data,
    loading,
    error,
    retry: fetchData,
    retryCount,
  };
}

/**
 * 실시간 폴링 API Hook
 */
export function usePollingApi<T>(
  apiCall: () => Promise<T>,
  interval: number = 5000,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    if (enabled) {
      fetchData(); // 초기 로드
      intervalRef.current = setInterval(fetchData, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    if (enabled) {
      intervalRef.current = setInterval(fetchData, interval);
    }
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    pause,
    resume,
  };
}