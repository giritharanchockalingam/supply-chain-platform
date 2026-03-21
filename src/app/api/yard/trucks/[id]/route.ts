import { NextRequest, NextResponse } from 'next/server'
import { getTruckById, updateTruckStatus } from '@/lib/data-access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const truck = await getTruckById(id)

    if (!truck) {
      return NextResponse.json(
        {
          success: false,
          error: 'Truck not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: truck,
    })
  } catch (error) {
    console.error('Error in GET /api/yard/trucks/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
        },
        { status: 400 }
      )
    }

    const success = await updateTruckStatus(id, status)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update truck status',
        },
        { status: 500 }
      )
    }

    const updatedTruck = await getTruckById(id)

    return NextResponse.json({
      success: true,
      data: updatedTruck,
    })
  } catch (error) {
    console.error('Error in PATCH /api/yard/trucks/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
