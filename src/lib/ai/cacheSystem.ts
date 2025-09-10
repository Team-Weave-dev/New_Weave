/**
 * 고성능 캐싱 시스템
 * Phase 4: 성능 최적화를 위한 다층 캐싱
 */

/**
 * 캐시 엔트리
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number; // milliseconds
  hits: number;
  lastAccess: Date;
  size?: number;
  tags?: string[];
}

/**
 * 캐시 통계
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
  hitRate: number;
}

/**
 * 캐시 정책
 */
export interface CachePolicy {
  maxSize: number; // bytes
  maxEntries: number;
  defaultTTL: number; // milliseconds
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  compressionEnabled: boolean;
}

/**
 * 캐시 레이어
 */
export enum CacheLayer {
  L1_MEMORY = 'L1_MEMORY',
  L2_SESSION = 'L2_SESSION', 
  L3_PERSISTENT = 'L3_PERSISTENT'
}

/**
 * 다층 캐싱 시스템
 */
export class MultiLayerCache {
  private l1Cache: Map<string, CacheEntry>; // 메모리 캐시
  private l2Cache: Map<string, CacheEntry>; // 세션 캐시
  private l3Cache: Map<string, CacheEntry>; // 영구 캐시 (실제로는 IndexedDB 사용 권장)
  private stats: CacheStats;
  private policy: CachePolicy;

  constructor(policy?: Partial<CachePolicy>) {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.l3Cache = new Map();
    
    this.policy = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 5 * 60 * 1000, // 5분
      evictionPolicy: 'LRU',
      compressionEnabled: true,
      ...policy
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      entries: 0,
      hitRate: 0
    };
    
    // 정기적인 정리
    this.startCleanupInterval();
  }

  /**
   * 캐시 조회
   */
  async get<T>(
    key: string,
    layer?: CacheLayer
  ): Promise<T | null> {
    const normalizedKey = this.normalizeKey(key);
    
    // L1 체크
    if (!layer || layer === CacheLayer.L1_MEMORY) {
      const l1Entry = this.l1Cache.get(normalizedKey);
      if (l1Entry && this.isValid(l1Entry)) {
        this.recordHit(l1Entry);
        return l1Entry.value as T;
      }
    }
    
    // L2 체크
    if (!layer || layer === CacheLayer.L2_SESSION) {
      const l2Entry = this.l2Cache.get(normalizedKey);
      if (l2Entry && this.isValid(l2Entry)) {
        this.recordHit(l2Entry);
        // L1로 승격
        this.promote(l2Entry, CacheLayer.L1_MEMORY);
        return l2Entry.value as T;
      }
    }
    
    // L3 체크
    if (!layer || layer === CacheLayer.L3_PERSISTENT) {
      const l3Entry = this.l3Cache.get(normalizedKey);
      if (l3Entry && this.isValid(l3Entry)) {
        this.recordHit(l3Entry);
        // L1로 승격
        this.promote(l3Entry, CacheLayer.L1_MEMORY);
        return l3Entry.value as T;
      }
    }
    
    this.recordMiss();
    return null;
  }

  /**
   * 캐시 저장
   */
  async set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      layer?: CacheLayer;
      tags?: string[];
    }
  ): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    const ttl = options?.ttl || this.policy.defaultTTL;
    const layer = options?.layer || CacheLayer.L1_MEMORY;
    
    const entry: CacheEntry<T> = {
      key: normalizedKey,
      value,
      timestamp: new Date(),
      ttl,
      hits: 0,
      lastAccess: new Date(),
      size: this.estimateSize(value),
      tags: options?.tags
    };
    
    // 크기 체크 및 제거
    await this.ensureSpace(entry.size || 0);
    
    // 레이어에 따라 저장
    switch (layer) {
      case CacheLayer.L1_MEMORY:
        this.l1Cache.set(normalizedKey, entry);
        break;
      case CacheLayer.L2_SESSION:
        this.l2Cache.set(normalizedKey, entry);
        break;
      case CacheLayer.L3_PERSISTENT:
        this.l3Cache.set(normalizedKey, entry);
        break;
    }
    
    this.updateStats();
  }

  /**
   * 캐시 삭제
   */
  async delete(key: string): Promise<boolean> {
    const normalizedKey = this.normalizeKey(key);
    
    const deleted = 
      this.l1Cache.delete(normalizedKey) ||
      this.l2Cache.delete(normalizedKey) ||
      this.l3Cache.delete(normalizedKey);
    
    if (deleted) {
      this.updateStats();
    }
    
    return deleted;
  }

  /**
   * 태그로 삭제
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;
    
    const deleteFromLayer = (cache: Map<string, CacheEntry>) => {
      for (const [key, entry] of cache.entries()) {
        if (entry.tags?.some(tag => tags.includes(tag))) {
          cache.delete(key);
          deletedCount++;
        }
      }
    };
    
    deleteFromLayer(this.l1Cache);
    deleteFromLayer(this.l2Cache);
    deleteFromLayer(this.l3Cache);
    
    this.updateStats();
    return deletedCount;
  }

  /**
   * 캐시 정리
   */
  async clear(layer?: CacheLayer): Promise<void> {
    if (!layer || layer === CacheLayer.L1_MEMORY) {
      this.l1Cache.clear();
    }
    if (!layer || layer === CacheLayer.L2_SESSION) {
      this.l2Cache.clear();
    }
    if (!layer || layer === CacheLayer.L3_PERSISTENT) {
      this.l3Cache.clear();
    }
    
    this.updateStats();
  }

  /**
   * 유효성 검사
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp.getTime();
    return age < entry.ttl;
  }

  /**
   * 히트 기록
   */
  private recordHit(entry: CacheEntry): void {
    entry.hits++;
    entry.lastAccess = new Date();
    this.stats.hits++;
    this.updateHitRate();
  }

  /**
   * 미스 기록
   */
  private recordMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  /**
   * 히트율 업데이트
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 캐시 승격
   */
  private promote(entry: CacheEntry, targetLayer: CacheLayer): void {
    switch (targetLayer) {
      case CacheLayer.L1_MEMORY:
        this.l1Cache.set(entry.key, entry);
        break;
      case CacheLayer.L2_SESSION:
        this.l2Cache.set(entry.key, entry);
        break;
    }
  }

  /**
   * 공간 확보
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.calculateTotalSize();
    
    if (currentSize + requiredSize > this.policy.maxSize) {
      await this.evict(requiredSize);
    }
    
    const currentEntries = this.l1Cache.size + this.l2Cache.size + this.l3Cache.size;
    if (currentEntries >= this.policy.maxEntries) {
      await this.evictEntries(1);
    }
  }

  /**
   * 제거 정책 실행
   */
  private async evict(requiredSize: number): Promise<void> {
    const policy = this.policy.evictionPolicy;
    let freedSize = 0;
    
    const candidates = this.getEvictionCandidates();
    
    for (const candidate of candidates) {
      if (freedSize >= requiredSize) break;
      
      const size = candidate.size || 0;
      this.l1Cache.delete(candidate.key);
      freedSize += size;
      this.stats.evictions++;
    }
  }

  /**
   * 엔트리 제거
   */
  private async evictEntries(count: number): Promise<void> {
    const candidates = this.getEvictionCandidates();
    
    for (let i = 0; i < Math.min(count, candidates.length); i++) {
      this.l1Cache.delete(candidates[i].key);
      this.stats.evictions++;
    }
  }

  /**
   * 제거 후보 선정
   */
  private getEvictionCandidates(): CacheEntry[] {
    const allEntries: CacheEntry[] = [];
    
    this.l1Cache.forEach(entry => allEntries.push(entry));
    
    switch (this.policy.evictionPolicy) {
      case 'LRU':
        return allEntries.sort((a, b) => 
          a.lastAccess.getTime() - b.lastAccess.getTime()
        );
      
      case 'LFU':
        return allEntries.sort((a, b) => a.hits - b.hits);
      
      case 'FIFO':
        return allEntries.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
      
      case 'TTL':
        return allEntries.sort((a, b) => {
          const aRemaining = a.ttl - (Date.now() - a.timestamp.getTime());
          const bRemaining = b.ttl - (Date.now() - b.timestamp.getTime());
          return aRemaining - bRemaining;
        });
      
      default:
        return allEntries;
    }
  }

  /**
   * 크기 계산
   */
  private calculateTotalSize(): number {
    let totalSize = 0;
    
    this.l1Cache.forEach(entry => {
      totalSize += entry.size || 0;
    });
    
    this.l2Cache.forEach(entry => {
      totalSize += entry.size || 0;
    });
    
    return totalSize;
  }

  /**
   * 크기 추정
   */
  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // 기본값 1KB
    }
  }

  /**
   * 키 정규화
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * 통계 업데이트
   */
  private updateStats(): void {
    this.stats.entries = 
      this.l1Cache.size + 
      this.l2Cache.size + 
      this.l3Cache.size;
    
    this.stats.size = this.calculateTotalSize();
  }

  /**
   * 정기 정리
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 1분마다
  }

  /**
   * 만료된 엔트리 정리
   */
  private cleanup(): void {
    const cleanLayer = (cache: Map<string, CacheEntry>) => {
      for (const [key, entry] of cache.entries()) {
        if (!this.isValid(entry)) {
          cache.delete(key);
        }
      }
    };
    
    cleanLayer(this.l1Cache);
    cleanLayer(this.l2Cache);
    cleanLayer(this.l3Cache);
    
    this.updateStats();
  }

  /**
   * 통계 조회
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 캐시 덤프 (디버깅용)
   */
  dump(): any {
    return {
      l1: Array.from(this.l1Cache.entries()).map(([k, v]) => ({
        key: k,
        hits: v.hits,
        age: Date.now() - v.timestamp.getTime(),
        size: v.size
      })),
      l2: Array.from(this.l2Cache.entries()).map(([k, v]) => ({
        key: k,
        hits: v.hits,
        age: Date.now() - v.timestamp.getTime(),
        size: v.size
      })),
      stats: this.getStats()
    };
  }
}

/**
 * 캐시 매니저 (싱글톤)
 */
export class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, MultiLayerCache>;

  private constructor() {
    this.caches = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 캐시 인스턴스 가져오기
   */
  getCache(
    name: string = 'default',
    policy?: Partial<CachePolicy>
  ): MultiLayerCache {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MultiLayerCache(policy));
    }
    return this.caches.get(name)!;
  }

  /**
   * 전체 캐시 통계
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    
    return stats;
  }

  /**
   * 전체 캐시 정리
   */
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }
}

export default CacheManager;