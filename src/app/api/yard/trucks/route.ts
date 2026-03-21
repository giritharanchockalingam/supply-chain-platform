import { NextRequest, NextResponse } from 'next/server'
import { getTrucks, checkInTruck } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const dcId = searchParams.get('dcId') || undefined
    const priority = searchParams.get('priority') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const trucks = await getTrucks({
      status: status || undefined,
      dcId: dcId || undefined,
      priority: priority || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: trucks,
      count: trucks.length,
    })
  } catch (error) {
    console.error('Error in GET /api/yard/trucks:', error)
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

    const {
      dcId,
      licensePlate,
      trailerNumber,
      carrierId,
      carrierName,
      driverName,
      driverPhone,
      bolId,
      gateId,
      temperatureClass,
    } = body

    if (!dcId || !licensePlate || !trailerNumber || !carrierId || !driverName || !bolId || !gateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const truck = await checkInTruck({
      dcId,
      licensePlate,
      trailerNumber,
      carrierId,
      carrierName,
      driverName,
      driverPhone,
      bolId,
      gateId,
      temperatureClass: temperatureClass || 'ambient',
    })

    if (!truck) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check in truck',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: truck,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/yard/trucks:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
