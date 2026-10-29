/**
 * High-performance, lightweight in-memory TTL cache.
 * Dramatically cuts down database queries and Supabase bills
 * by serving frequently read data (events, profiles, universities, etc.) directly from RAM.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run background sweep every 60 seconds to prune expired entries and keep memory lean
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.pruneExpired(), 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Retrieves an item from cache if it exists and hasn't expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Saves an item to cache with a specified TTL in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Deletes a specific key from cache.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Deletes all keys matching a prefix (e.g. 'events:' or 'user:123').
   * Ideal for invalidating queries when data changes.
   */
  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Returns cached value if available, or calls fetcher, stores result, and returns it.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new MemoryCache();

