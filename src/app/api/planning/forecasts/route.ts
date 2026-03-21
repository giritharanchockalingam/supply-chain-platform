import { NextRequest, NextResponse } from 'next/server'
import { getForecasts, updateForecast } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId') || undefined
    const productId = searchParams.get('productId') || undefined
    const status = searchParams.get('status') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const forecasts = await getForecasts({
      customerId: customerId,
      productId: productId,
      status: status,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: forecasts,
      count: forecasts.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/forecasts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, adjustedQuantity, adjustmentReason, status } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'id is required',
        },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (adjustedQuantity !== undefined) {
      updates.forecast_quantity = adjustedQuantity
      updates.adjusted_by = 'user'
      updates.adjustment_reason = adjustmentReason || 'Manual adjustment'
    }

    if (status) {
      updates.status = status
    }

    const success = await updateForecast(id, updates as any)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update forecast',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Forecast updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/planning/forecasts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
