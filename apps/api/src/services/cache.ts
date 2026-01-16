// PreSocial Cache Service
// Supports both Redis and in-memory caching

import type { CacheEntry } from '../types';

// In-memory cache as fallback
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SEARCH: 300,        // 5 minutes
  POST: 900,          // 15 minutes
  COMMUNITIES: 3600,  // 1 hour
  TRENDING: 1800,     // 30 minutes
} as const;

// Redis client (lazy initialization)
let redisClient: import('ioredis').Redis | null = null;

async function getRedisClient(): Promise<import('ioredis').Redis | null> {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('[Cache] No REDIS_URL configured, using in-memory cache');
    return null;
  }

  try {
    const { Redis } = await import('ioredis');
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    await redisClient.connect();
    console.log('[Cache] Connected to Redis');
    return redisClient;
  } catch (error) {
    console.warn('[Cache] Failed to connect to Redis, using in-memory cache:', error);
    return null;
  }
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const prefixedKey = `presocial:${key}`;

  try {
    const redis = await getRedisClient();

    if (redis) {
      const data = await redis.get(prefixedKey);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    }

    // Fallback to memory cache
    const entry = memoryCache.get(prefixedKey) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      memoryCache.delete(prefixedKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const prefixedKey = `presocial:${key}`;

  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.setex(prefixedKey, ttlSeconds, JSON.stringify(value));
      return;
    }

    // Fallback to memory cache
    memoryCache.set(prefixedKey, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    });

    // Clean up old entries periodically
    if (memoryCache.size > 1000) {
      cleanupMemoryCache();
    }
  } catch (error) {
    console.error('[Cache] Set error:', error);
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const prefixedKey = `presocial:${key}`;

  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.del(prefixedKey);
      return;
    }

    memoryCache.delete(prefixedKey);
  } catch (error) {
    console.error('[Cache] Delete error:', error);
  }
}

/**
 * Invalidate cache by pattern
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const prefixedPattern = `presocial:${pattern}`;

  try {
    const redis = await getRedisClient();

    if (redis) {
      const keys = await redis.keys(prefixedPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return;
    }

    // Fallback: iterate memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefixedPattern.replace('*', ''))) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error('[Cache] Invalidate error:', error);
  }
}

/**
 * Generate cache key from search query
 */
export function generateSearchKey(query: string, options?: Record<string, unknown>): string {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const optionsStr = options ? JSON.stringify(options) : '';
  const hash = simpleHash(`${normalizedQuery}:${optionsStr}`);
  return `search:${hash}`;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cleanup expired entries from memory cache
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.timestamp + entry.ttl * 1000) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  size: number;
  connected: boolean;
}> {
  const redis = await getRedisClient();

  if (redis) {
    try {
      const info = await redis.dbsize();
      return { type: 'redis', size: info, connected: true };
    } catch {
      return { type: 'redis', size: 0, connected: false };
    }
  }

  return { type: 'memory', size: memoryCache.size, connected: true };
}
