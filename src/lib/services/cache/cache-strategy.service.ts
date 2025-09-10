/**
 * 캐싱 전략 서비스
 * 다층 캐싱 시스템 구현
 */

import { createClient } from '@/lib/services/supabase/client';

// 캐시 타입 정의
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live (ms)
  tags?: string[]; // 캐시 태그
  compress?: boolean; // 압축 여부
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

/**
 * 메모리 캐시 (L1 캐시)
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize = 50 * 1024 * 1024; // 50MB
  private currentSize = 0;

  /**
   * 캐시 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data;
  }

  /**
   * 캐시 저장
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 5 * 60 * 1000; // 기본 5분
    const size = this.estimateSize(data);
    
    // 크기 제한 확인
    if (this.currentSize + size > this.maxSize) {
      this.evict();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags
    });
    
    this.currentSize += size;
  }

  /**
   * 캐시 무효화
   */
  invalidate(pattern?: string | string[]): void {
    if (!pattern) {
      this.cache.clear();
      this.currentSize = 0;
      return;
    }
    
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    
    for (const [key, entry] of this.cache.entries()) {
      // 패턴 매칭
      if (patterns.some(p => key.includes(p))) {
        this.cache.delete(key);
        this.currentSize -= this.estimateSize(entry.data);
      }
      
      // 태그 매칭
      if (entry.tags) {
        if (patterns.some(p => entry.tags?.includes(p))) {
          this.cache.delete(key);
          this.currentSize -= this.estimateSize(entry.data);
        }
      }
    }
  }

  /**
   * LRU 방식으로 캐시 제거
   */
  private evict(): void {
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 가장 오래된 항목부터 제거
    for (const [key, entry] of sortedEntries) {
      this.cache.delete(key);
      this.currentSize -= this.estimateSize(entry.data);
      
      if (this.currentSize < this.maxSize * 0.8) {
        break;
      }
    }
  }

  /**
   * 데이터 크기 추정
   */
  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // UTF-16 기준
  }

  /**
   * 통계 조회
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.currentSize,
      entries: this.cache.size
    };
  }
}

/**
 * SessionStorage 캐시 (L2 캐시)
 */
export class SessionCache {
  private prefix = 'weave_cache_';

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // TTL 확인
      if (Date.now() - entry.timestamp > entry.ttl) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    if (typeof window === 'undefined') return;
    
    const ttl = options.ttl || 30 * 60 * 1000; // 기본 30분
    
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags
      };
      
      sessionStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      // 용량 초과 시 오래된 항목 제거
      this.cleanup();
      try {
        sessionStorage.setItem(this.prefix + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
      } catch {
        console.warn('SessionStorage full');
      }
    }
  }

  invalidate(pattern?: string): void {
    if (typeof window === 'undefined') return;
    
    if (!pattern) {
      // 모든 캐시 삭제
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(k => sessionStorage.removeItem(k));
      return;
    }
    
    // 패턴 매칭 삭제
    const keys = Object.keys(sessionStorage).filter(k => 
      k.startsWith(this.prefix) && k.includes(pattern)
    );
    keys.forEach(k => sessionStorage.removeItem(k));
  }

  private cleanup(): void {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(this.prefix));
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    keys.forEach(key => {
      try {
        const item = sessionStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          entries.push({ key, timestamp: entry.timestamp });
        }
      } catch {
        sessionStorage.removeItem(key);
      }
    });
    
    // 오래된 순으로 정렬
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // 절반 제거
    const toRemove = Math.floor(entries.length / 2);
    for (let i = 0; i < toRemove; i++) {
      sessionStorage.removeItem(entries[i].key);
    }
  }
}

/**
 * IndexedDB 캐시 (L3 캐시)
 */
export class IndexedDBCache {
  private dbName = 'WeaveCache';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        // TTL 확인
        if (Date.now() - result.timestamp > result.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }
        
        resolve(result.data);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;
    
    const ttl = options.ttl || 24 * 60 * 60 * 1000; // 기본 24시간
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const entry = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags || []
      };
      
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * 통합 캐시 매니저
 */
export class CacheManager {
  private memoryCache = new MemoryCache();
  private sessionCache = new SessionCache();
  private indexedDBCache = new IndexedDBCache();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.indexedDBCache.init();
    this.initialized = true;
  }

  /**
   * 계층적 캐시 조회
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: 메모리 캐시
    let data = this.memoryCache.get<T>(key);
    if (data) return data;
    
    // L2: SessionStorage
    data = this.sessionCache.get<T>(key);
    if (data) {
      // L1에 복사
      this.memoryCache.set(key, data, { ttl: 5 * 60 * 1000 });
      return data;
    }
    
    // L3: IndexedDB
    data = await this.indexedDBCache.get<T>(key);
    if (data) {
      // L1, L2에 복사
      this.memoryCache.set(key, data, { ttl: 5 * 60 * 1000 });
      this.sessionCache.set(key, data, { ttl: 30 * 60 * 1000 });
      return data;
    }
    
    return null;
  }

  /**
   * 계층적 캐시 저장
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    // 모든 계층에 저장
    this.memoryCache.set(key, data, { ...options, ttl: options.ttl || 5 * 60 * 1000 });
    this.sessionCache.set(key, data, { ...options, ttl: options.ttl || 30 * 60 * 1000 });
    await this.indexedDBCache.set(key, data, { ...options, ttl: options.ttl || 24 * 60 * 60 * 1000 });
  }

  /**
   * 캐시 무효화
   */
  async invalidate(pattern?: string): Promise<void> {
    this.memoryCache.invalidate(pattern);
    this.sessionCache.invalidate(pattern);
    
    if (!pattern) {
      await this.indexedDBCache.clear();
    }
  }

  /**
   * 캐시 통계
   */
  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * 캐시 워밍
   */
  async warmup(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async key => {
      const cached = await this.get(key);
      if (!cached) {
        const data = await loader(key);
        if (data) {
          await this.set(key, data);
        }
      }
    });
    
    await Promise.all(promises);
  }
}

// 싱글톤 인스턴스
export const cacheManager = new CacheManager();

// React Hook
export function useCache() {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    invalidate: cacheManager.invalidate.bind(cacheManager),
    stats: cacheManager.getStats.bind(cacheManager)
  };
}