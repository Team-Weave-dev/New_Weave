/**
 * 성능 최적화 유틸리티
 * React.memo, useMemo, useCallback 관련 헬퍼 함수들
 */

import { DependencyList } from 'react';

/**
 * 깊은 비교를 위한 커스텀 비교 함수
 * React.memo와 함께 사용
 */
export function arePropsEqual<P extends Record<string, any>>(
  prevProps: P,
  nextProps: P,
  ignoreKeys: string[] = []
): boolean {
  const prevKeys = Object.keys(prevProps).filter(key => !ignoreKeys.includes(key));
  const nextKeys = Object.keys(nextProps).filter(key => !ignoreKeys.includes(key));
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) {
      return false;
    }
    
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    if (prevValue !== nextValue) {
      // 함수는 참조 비교만 수행
      if (typeof prevValue === 'function' && typeof nextValue === 'function') {
        continue;
      }
      
      // 배열 비교
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) {
          return false;
        }
        for (let i = 0; i < prevValue.length; i++) {
          if (prevValue[i] !== nextValue[i]) {
            return false;
          }
        }
        continue;
      }
      
      // 객체 비교 (얕은 비교)
      if (prevValue && nextValue && typeof prevValue === 'object' && typeof nextValue === 'object') {
        const prevObjKeys = Object.keys(prevValue);
        const nextObjKeys = Object.keys(nextValue);
        
        if (prevObjKeys.length !== nextObjKeys.length) {
          return false;
        }
        
        for (const objKey of prevObjKeys) {
          if (prevValue[objKey] !== nextValue[objKey]) {
            return false;
          }
        }
        continue;
      }
      
      return false;
    }
  }
  
  return true;
}

/**
 * 위젯 props 비교 함수
 * 위젯 컴포넌트에 특화된 비교 로직
 */
export function areWidgetPropsEqual<P extends { id: string; config?: any }>(
  prevProps: P,
  nextProps: P
): boolean {
  // ID가 다르면 다른 위젯
  if (prevProps.id !== nextProps.id) {
    return false;
  }
  
  // config 비교
  if (prevProps.config && nextProps.config) {
    return JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config);
  }
  
  return prevProps.config === nextProps.config;
}

/**
 * 계산 비용이 높은 작업을 위한 캐싱 헬퍼
 */
export class ComputationCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMs: number = 5000) {
    this.ttl = ttlMs;
  }
  
  get(key: string, compute: () => T): T {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < this.ttl) {
      return cached.value;
    }
    
    const value = compute();
    this.cache.set(key, { value, timestamp: now });
    return value;
  }
  
  clear() {
    this.cache.clear();
  }
}

/**
 * 디바운스된 값을 반환하는 훅을 위한 헬퍼
 */
export function createDebouncedValue<T>(value: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  let debouncedValue = value;
  
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  timeoutId = setTimeout(() => {
    debouncedValue = value;
  }, delay);
  
  return debouncedValue;
}

/**
 * 의존성 배열 최적화를 위한 헬퍼
 * 불필요한 참조 변경을 방지
 */
export function useStableDeps(deps: DependencyList): DependencyList {
  // 의존성 배열의 각 항목을 안정화
  return deps.map(dep => {
    if (typeof dep === 'function') {
      // 함수는 그대로 반환 (useCallback으로 처리되어야 함)
      return dep;
    }
    
    if (Array.isArray(dep)) {
      // 배열은 JSON으로 직렬화하여 비교
      return JSON.stringify(dep);
    }
    
    if (dep && typeof dep === 'object') {
      // 객체는 JSON으로 직렬화하여 비교
      return JSON.stringify(dep);
    }
    
    // 원시 타입은 그대로 반환
    return dep;
  });
}

/**
 * 렌더링 성능 측정 헬퍼
 */
export class RenderProfiler {
  private renderCounts = new Map<string, number>();
  private renderTimes = new Map<string, number[]>();
  
  onRender(id: string, phase: 'mount' | 'update', duration: number) {
    // 렌더링 횟수 증가
    const count = this.renderCounts.get(id) || 0;
    this.renderCounts.set(id, count + 1);
    
    // 렌더링 시간 기록
    const times = this.renderTimes.get(id) || [];
    times.push(duration);
    if (times.length > 100) {
      times.shift(); // 최대 100개만 유지
    }
    this.renderTimes.set(id, times);
  }
  
  getStats(id: string) {
    const count = this.renderCounts.get(id) || 0;
    const times = this.renderTimes.get(id) || [];
    
    if (times.length === 0) {
      return { count, avgTime: 0, minTime: 0, maxTime: 0 };
    }
    
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return { count, avgTime, minTime, maxTime };
  }
  
  logStats() {
    console.group('🎨 Render Performance Stats');
    
    this.renderCounts.forEach((count, id) => {
      const stats = this.getStats(id);
      console.log(`${id}: ${count} renders, avg: ${stats.avgTime.toFixed(2)}ms`);
    });
    
    console.groupEnd();
  }
  
  reset() {
    this.renderCounts.clear();
    this.renderTimes.clear();
  }
}

// 전역 프로파일러 인스턴스
export const globalProfiler = new RenderProfiler();