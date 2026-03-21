import { NextRequest, NextResponse } from 'next/server'
import { getReplenishments, approveReplenishment, bulkApproveReplenishments } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const urgency = searchParams.get('urgency') || undefined
    const status = searchParams.get('status') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const replenishments = await getReplenishments({
      urgency: urgency,
      status: status,
      customerId: customerId,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: replenishments,
      count: replenishments.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/replenishments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ids, approvedBy } = body

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'action and ids array are required',
        },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      if (!approvedBy) {
        return NextResponse.json(
          {
            success: false,
            error: 'approvedBy is required for approve action',
          },
          { status: 400 }
        )
      }

      const success = await bulkApproveReplenishments(ids, approvedBy)

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to approve replenishments',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `${ids.length} replenishments approved successfully`,
        approvedCount: ids.length,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/replenishments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
