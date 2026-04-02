export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}
