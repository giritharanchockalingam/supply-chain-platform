import { NextRequest, NextResponse } from 'next/server'
import { getDocks, assignDock } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dcId = searchParams.get('dcId')

    if (!dcId) {
      return NextResponse.json(
        {
          success: false,
          error: 'dcId is required',
        },
        { status: 400 }
      )
    }

    const docks = await getDocks(dcId)

    return NextResponse.json({
      success: true,
      data: docks,
      count: docks.length,
    })
  } catch (error) {
    console.error('Error in GET /api/yard/docks:', error)
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
    const { truckId, dockId } = body

    if (!truckId || !dockId) {
      return NextResponse.json(
        {
          success: false,
          error: 'truckId and dockId are required',
        },
        { status: 400 }
      )
    }

    const success = await assignDock(truckId, dockId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to assign dock',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Dock assigned successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/yard/docks:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
