import * as Sentry from '@sentry/nextjs'

// ========== SENTRY ERROR MONITORING ==========
// Free tier: 5K errors/month, 10K performance transactions
// Used for: error tracking, performance monitoring, release health

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

let initialized = false

export function initSentry() {
  if (initialized || !sentryDsn) return

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Session replay (free tier supports this)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.replayIntegration(),
    ],

    // Filter out noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
    ],

    // Tag supply chain domain context
    initialScope: {
      tags: {
        app: 'supply-chain-command-center',
        platform: 'next.js',
      },
    },
  })

  initialized = true
}

// ========== ERROR CAPTURE HELPERS ==========

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!sentryDsn) {
    console.error('[Sentry disabled]', error.message, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryDsn) {
    console.log(`[Sentry disabled] [${level}]`, message)
    return
  }

  Sentry.captureMessage(message, level)
}

export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser(user)
}

export function addBreadcrumb(params: {
  category: string
  message: string
  level?: 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}) {
  Sentry.addBreadcrumb({
    category: params.category,
    message: params.message,
    level: params.level || 'info',
    data: params.data,
  })
}

// ========== PERFORMANCE TRACKING ==========

export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {})
}

// ========== HEALTH CHECK ==========
export async function checkSentryHealth(): Promise<{
  connected: boolean
  dsn: boolean
  error?: string
}> {
  if (!sentryDsn) {
    return { connected: false, dsn: false, error: 'Sentry not configured (missing SENTRY_DSN)' }
  }
  return { connected: true, dsn: true }
}
