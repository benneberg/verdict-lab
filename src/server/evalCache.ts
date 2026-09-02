import crypto from "crypto";

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  evictions: number;
  hitRatio: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
}

export class EvaluationCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTtlMs: number;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(maxSize: number = 500, defaultTtlMs: number = 60 * 60 * 1000) { // default 1 hour
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Generates a deterministic SHA-256 cache key from an evaluation payload.
   */
  public generateKey(payload: {
    variantA: string;
    variantB: string;
    rubric?: Record<string, any>;
    hypothesis?: string;
    models?: string[];
  }): string {
    const canonicalPayload = {
      variantA: (payload.variantA || "").trim(),
      variantB: (payload.variantB || "").trim(),
      hypothesis: (payload.hypothesis || "").trim(),
      rubric: payload.rubric ? Object.keys(payload.rubric).sort().reduce((acc: any, k) => {
        acc[k] = payload.rubric![k];
        return acc;
      }, {}) : {},
      models: Array.isArray(payload.models) ? [...payload.models].sort() : ["gemini-3.5-flash"]
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(canonicalPayload))
      .digest("hex");
  }

  /**
   * Retrieve a cached item if it exists and has not expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.accessCount++;
    this.hits++;
    return entry.value as T;
  }

  /**
   * Store an item in the cache with eviction policy if limit is reached.
   */
  public set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttlMs || this.defaultTtlMs);

    // Evict oldest or least accessed entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
    });
  }

  /**
   * Clear all cache entries.
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get telemetry statistics for the cache.
   */
  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.evictions,
      hitRatio: totalRequests > 0 ? Number((this.hits / totalRequests).toFixed(4)) : 0,
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < Date.now()) {
        // Immediate cleanup of expired
        this.cache.delete(key);
        this.evictions++;
        return;
      }
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }
}

export const evalCache = new EvaluationCache();
