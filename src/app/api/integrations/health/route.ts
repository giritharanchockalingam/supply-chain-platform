import { NextResponse } from 'next/server'
import { checkRedisHealth } from '@/lib/integrations/redis'
import { checkEmailHealth } from '@/lib/integrations/email'
import { checkQStashHealth } from '@/lib/integrations/qstash'
import { checkSentryHealth } from '@/lib/integrations/monitoring'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/integrations/health
 * Returns the connection status of all integrated services.
 * Used by the architecture page to show real-time integration health.
 */
export async function GET() {
  const startTime = Date.now()

  // Run all health checks in parallel
  const [redisHealth, emailHealth, qstashHealth, sentryHealth] = await Promise.all([
    checkRedisHealth(),
    checkEmailHealth(),
    checkQStashHealth(),
    checkSentryHealth(),
  ])

  // Supabase check — just verify env vars are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseConnected = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'))

  // Vercel check
  const vercelConnected = Boolean(process.env.VERCEL)

  // GitHub check
  const githubConnected = Boolean(process.env.VERCEL_GIT_PROVIDER === 'github' || process.env.VERCEL_GIT_REPO_SLUG)

  // LLM provider checks
  const claudeConnected = Boolean(process.env.ANTHROPIC_API_KEY)
  const openaiConnected = Boolean(process.env.OPENAI_API_KEY)
  const groqConnected = Boolean(process.env.GROQ_API_KEY)

  const integrations = {
    // Data Platform
    supabase: { connected: supabaseConnected, tier: 'Freemium', category: 'data-platform' },
    redis: { connected: redisHealth.connected, latencyMs: redisHealth.latencyMs, tier: 'Free', category: 'data-platform', error: redisHealth.error },

    // AI / ML
    claude: { connected: claudeConnected, tier: 'Freemium', category: 'ai-ml' },
    openai: { connected: openaiConnected, tier: 'Freemium', category: 'ai-ml' },
    groq: { connected: groqConnected, tier: 'Free', category: 'ai-ml' },

    // Cloud & Infra
    vercel: { connected: vercelConnected, tier: 'Freemium', category: 'cloud-infra' },
    github: { connected: githubConnected, tier: 'Free', category: 'devops' },

    // Communication
    resend: { connected: emailHealth.connected, tier: 'Free', category: 'communication', error: emailHealth.error },

    // Monitoring
    sentry: { connected: sentryHealth.connected, dsn: sentryHealth.dsn, tier: 'Free', category: 'monitoring', error: sentryHealth.error },

    // Message Queue
    qstash: { connected: qstashHealth.connected, tier: 'Free', category: 'cloud-infra', error: qstashHealth.error },
  }

  const connectedCount = Object.values(integrations).filter(i => i.connected).length
  const totalCount = Object.keys(integrations).length

  return NextResponse.json({
    status: connectedCount >= 3 ? 'healthy' : connectedCount >= 1 ? 'degraded' : 'offline',
    connectedCount,
    totalCount,
    responseTimeMs: Date.now() - startTime,
    integrations,
    timestamp: new Date().toISOString(),
  })
}
