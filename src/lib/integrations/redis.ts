import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// ========== UPSTASH REDIS CLIENT ==========
// Free tier: 500K commands/month, 256MB storage
// Used for: rate limiting, caching, session state

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

// ========== RATE LIMITER ==========
// Sliding window: 30 requests per 10 seconds per IP
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      analytics: true,
      prefix: 'sc:ratelimit:api',
    })
  : null

// AI endpoint rate limiter: 5 requests per minute per IP
export const aiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'sc:ratelimit:ai',
    })
  : null

// ========== CACHE HELPERS ==========
const CACHE_PREFIX = 'sc:cache:'

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    return await redis.get<T>(`${CACHE_PREFIX}${key}`)
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  if (!redis) return
  try {
    await redis.set(`${CACHE_PREFIX}${key}`, value, { ex: ttlSeconds })
  } catch {
    // Silently fail — cache is optional
  }
}

export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(`${CACHE_PREFIX}${key}`)
  } catch {
    // Silently fail
  }
}

// ========== HEALTH CHECK ==========
export async function checkRedisHealth(): Promise<{
  connected: boolean
  latencyMs: number | null
  error?: string
}> {
  if (!redis) {
    return { connected: false, latencyMs: null, error: 'Redis not configured (missing env vars)' }
  }
  try {
    const start = Date.now()
    await redis.ping()
    return { connected: true, latencyMs: Date.now() - start }
  } catch (e) {
    return { connected: false, latencyMs: null, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
