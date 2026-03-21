import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/api/ai/:path*', '/api/notifications/:path*'],
}

export async function middleware(request: NextRequest) {
  // Only rate limit in production and when Redis is configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!redisUrl || !redisToken) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous'
  const isAiRoute = request.nextUrl.pathname.startsWith('/api/ai')

  // Use Upstash REST API directly in middleware (edge-compatible)
  const limit = isAiRoute ? 5 : 30
  const window = isAiRoute ? 60 : 10
  const key = `sc:ratelimit:${isAiRoute ? 'ai' : 'api'}:${ip}`

  try {
    const response = await fetch(`${redisUrl}/multi-exec`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, window],
      ]),
    })

    const data = await response.json()
    const count = data?.result?.[0]?.result ?? 0

    if (count > limit) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: window,
          limit,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(window),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Limit', String(limit))
    res.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - count)))
    return res
  } catch {
    // If Redis fails, allow the request through
    return NextResponse.next()
  }
}
