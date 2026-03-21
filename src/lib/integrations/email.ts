import { Resend } from 'resend'

// ========== RESEND EMAIL CLIENT ==========
// Free tier: 3,000 emails/month, 100/day cap
// Used for: exception alerts, daily summaries, system notifications

const resendKey = process.env.RESEND_API_KEY
export const resend = resendKey ? new Resend(resendKey) : null

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'Supply Chain <onboarding@resend.dev>'
const ALERT_RECIPIENTS = (process.env.ALERT_RECIPIENTS || '').split(',').filter(Boolean)

// ========== EMAIL TEMPLATES ==========

export async function sendExceptionAlert(params: {
  type: string
  severity: 'critical' | 'warning' | 'info'
  truckId: string
  licensePlate: string
  description: string
  createdAt: string
}) {
  if (!resend || ALERT_RECIPIENTS.length === 0) return null

  const severityColors = {
    critical: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ALERT_RECIPIENTS,
    subject: `[${params.severity.toUpperCase()}] ${params.type} — ${params.licensePlate}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Supply Chain Command Center</h1>
          <p style="color: #94a3b8; margin: 4px 0 0;">Exception Alert</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid ${severityColors[params.severity]};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: ${severityColors[params.severity]}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${params.severity}</span>
              <span style="color: #64748b; font-size: 13px;">${new Date(params.createdAt).toLocaleString()}</span>
            </div>
            <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 18px;">${params.type}</h2>
            <p style="color: #475569; margin: 0 0 16px; line-height: 1.5;">${params.description}</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">Truck ID</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; border-top: 1px solid #e2e8f0; text-align: right;">${params.truckId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">License Plate</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; border-top: 1px solid #e2e8f0; text-align: right;">${params.licensePlate}</td>
              </tr>
            </table>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 16px 0 0;">
            Sent by Supply Chain Command Center &middot; Powered by Resend
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    console.error('Failed to send exception alert:', error)
    return null
  }
  return data
}

export async function sendDailySummary(params: {
  date: string
  trucksProcessed: number
  exceptionsRaised: number
  exceptionsResolved: number
  avgDwellTime: number
  dockUtilization: number
}) {
  if (!resend || ALERT_RECIPIENTS.length === 0) return null

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ALERT_RECIPIENTS,
    subject: `Daily Summary — ${params.date}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Daily Operations Summary</h1>
          <p style="color: #94a3b8; margin: 4px 0 0;">${params.date}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: white; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${params.trucksProcessed}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Trucks Processed</div>
            </div>
            <div style="background: white; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${params.avgDwellTime}m</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Avg Dwell Time</div>
            </div>
            <div style="background: white; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${params.exceptionsRaised}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Exceptions Raised</div>
            </div>
            <div style="background: white; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #10b981;">${params.dockUtilization}%</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Dock Utilization</div>
            </div>
          </div>
        </div>
      </div>
    `,
  })

  if (error) {
    console.error('Failed to send daily summary:', error)
    return null
  }
  return data
}

// ========== HEALTH CHECK ==========
export async function checkEmailHealth(): Promise<{
  connected: boolean
  error?: string
}> {
  if (!resend) {
    return { connected: false, error: 'Resend not configured (missing RESEND_API_KEY)' }
  }
  try {
    // Verify API key by listing domains
    await resend.domains.list()
    return { connected: true }
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
