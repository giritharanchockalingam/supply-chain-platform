import { Client } from '@upstash/qstash'

// ========== UPSTASH QSTASH CLIENT ==========
// Free tier: 500 messages/day
// Used for: background job queue, webhook delivery, scheduled tasks

const qstashToken = process.env.QSTASH_TOKEN
export const qstash = qstashToken ? new Client({ token: qstashToken }) : null

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

// ========== JOB PUBLISHING ==========

/**
 * Queue an exception alert email to be sent asynchronously
 */
export async function queueExceptionAlert(params: {
  type: string
  severity: string
  truckId: string
  licensePlate: string
  description: string
  createdAt: string
}) {
  if (!qstash) return null
  try {
    const result = await qstash.publishJSON({
      url: `${APP_URL}/api/notifications`,
      body: { action: 'exception_alert', ...params },
      retries: 3,
    })
    return result
  } catch (e) {
    console.error('QStash publish failed:', e)
    return null
  }
}

/**
 * Queue a daily summary email
 */
export async function queueDailySummary(params: {
  date: string
  trucksProcessed: number
  exceptionsRaised: number
  exceptionsResolved: number
  avgDwellTime: number
  dockUtilization: number
}) {
  if (!qstash) return null
  try {
    const result = await qstash.publishJSON({
      url: `${APP_URL}/api/notifications`,
      body: { action: 'daily_summary', ...params },
      retries: 2,
    })
    return result
  } catch (e) {
    console.error('QStash publish failed:', e)
    return null
  }
}

/**
 * Schedule a delayed job (e.g., follow-up check on unresolved exceptions)
 */
export async function scheduleDelayedCheck(params: {
  exceptionId: string
  delaySecs: number
}) {
  if (!qstash) return null
  try {
    const result = await qstash.publishJSON({
      url: `${APP_URL}/api/cron/exception-followup`,
      body: { exceptionId: params.exceptionId },
      delay: params.delaySecs,
      retries: 2,
    })
    return result
  } catch (e) {
    console.error('QStash schedule failed:', e)
    return null
  }
}

// ========== HEALTH CHECK ==========
export async function checkQStashHealth(): Promise<{
  connected: boolean
  error?: string
}> {
  if (!qstash) {
    return { connected: false, error: 'QStash not configured (missing QSTASH_TOKEN)' }
  }
  try {
    // Verify connection by listing events (lightweight)
    await qstash.events({ count: 1 })
    return { connected: true }
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
