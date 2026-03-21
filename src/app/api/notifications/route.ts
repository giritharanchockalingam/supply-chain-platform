import { NextRequest, NextResponse } from 'next/server'
import { sendExceptionAlert, sendDailySummary } from '@/lib/integrations/email'

export const runtime = 'nodejs'

/**
 * POST /api/notifications
 * Handles notification delivery — called directly or via QStash webhook.
 * Supports: exception_alert, daily_summary
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'exception_alert': {
        const result = await sendExceptionAlert({
          type: params.type || 'Unknown Exception',
          severity: params.severity || 'info',
          truckId: params.truckId || 'N/A',
          licensePlate: params.licensePlate || 'N/A',
          description: params.description || 'No description provided',
          createdAt: params.createdAt || new Date().toISOString(),
        })

        return NextResponse.json({
          success: true,
          action: 'exception_alert',
          emailId: result?.id || null,
        })
      }

      case 'daily_summary': {
        const result = await sendDailySummary({
          date: params.date || new Date().toLocaleDateString(),
          trucksProcessed: params.trucksProcessed ?? 0,
          exceptionsRaised: params.exceptionsRaised ?? 0,
          exceptionsResolved: params.exceptionsResolved ?? 0,
          avgDwellTime: params.avgDwellTime ?? 0,
          dockUtilization: params.dockUtilization ?? 0,
        })

        return NextResponse.json({
          success: true,
          action: 'daily_summary',
          emailId: result?.id || null,
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Notification route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
