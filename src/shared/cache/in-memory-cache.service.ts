import type { ICache } from "@/application/ports/ICache";
import type { CacheEntry } from "./cache-entry";
import { env } from "@/config/env";

export type InMemoryCacheOptions = {
  ttlMs?: number;
  maxEntries?: number;
};

export class InMemoryCacheService<T> implements ICache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options?: InMemoryCacheOptions) {
    this.ttlMs = options?.ttlMs ?? (env.CACHE_TTL_SECONDS ?? 300) * 1000;
    this.maxEntries = options?.maxEntries ?? env.CACHE_MAX_ENTRIES ?? 5000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    entry.lastAccessedAt = Date.now();
    return entry.value;
  }

  set(key: string, value: T): void {
    if (
      this.maxEntries > 0 &&
      !this.store.has(key) &&
      this.store.size >= this.maxEntries
    ) {
      this.evictLru();
    }

    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + this.ttlMs,
      lastAccessedAt: now,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  purgeExpired(): void {
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      }
    }
  }

  private evictLru(): void {
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;
    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessedAt < oldestAccess) {
        oldestAccess = entry.lastAccessedAt;
        oldestKey = key;
      }
    }
    if (oldestKey !== undefined) {
      this.store.delete(oldestKey);
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt <= Date.now();
  }
}
