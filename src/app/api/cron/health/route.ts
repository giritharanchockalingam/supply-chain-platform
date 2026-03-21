import { NextResponse } from 'next/server'
import { cacheSet, cacheGet, redis } from '@/lib/integrations/redis'
import { captureMessage } from '@/lib/integrations/monitoring'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/cron/health
 * Scheduled health check — runs via Vercel Cron every 5 minutes.
 * Pings all integrations, caches the result in Redis, and logs to Sentry.
 *
 * Vercel Cron config in vercel.json:
 * See vercel.json for schedule (every 5 minutes)
 */
export async function GET(request: Request) {
  // Verify cron authorization (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks: Record<string, boolean> = {}

  // Redis ping
  if (redis) {
    try {
      await redis.ping()
      checks.redis = true
    } catch {
      checks.redis = false
    }
  }

  // Supabase env check
  checks.supabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // LLM keys
  checks.claude = Boolean(process.env.ANTHROPIC_API_KEY)
  checks.openai = Boolean(process.env.OPENAI_API_KEY)
  checks.groq = Boolean(process.env.GROQ_API_KEY)
  checks.resend = Boolean(process.env.RESEND_API_KEY)
  checks.sentry = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

  const connectedCount = Object.values(checks).filter(Boolean).length
  const totalCount = Object.keys(checks).length

  const healthReport = {
    status: connectedCount >= 4 ? 'healthy' : 'degraded',
    checks,
    connectedCount,
    totalCount,
    timestamp: new Date().toISOString(),
  }

  // Cache result in Redis for the dashboard
  await cacheSet('health:latest', healthReport, 600)

  // Log to Sentry if degraded
  if (healthReport.status === 'degraded') {
    captureMessage(`Health check degraded: ${connectedCount}/${totalCount} services online`, 'warning')
  }

  return NextResponse.json(healthReport)
}
