import { NextRequest, NextResponse } from 'next/server'
import { getTrucks } from '@/lib/data-access'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dcId, cameraId, licensePlate, trailerNumber, imageUrl } = body

    if (!dcId || !cameraId || !licensePlate) {
      return NextResponse.json(
        {
          success: false,
          error: 'dcId, cameraId, and licensePlate are required',
        },
        { status: 400 }
      )
    }

    const trucks = await getTrucks({ dcId })
    const matchingTruck = trucks.find((t) => t.license_plate === licensePlate)

    const eventData = {
      dc_id: dcId,
      camera_id: cameraId,
      event_type: 'arrival' as const,
      timestamp: new Date().toISOString(),
      license_plate: licensePlate,
      trailer_number: trailerNumber || '',
      ocr_confidence: 0.85,
      image_url: imageUrl || '',
      truck_id: matchingTruck?.id || null,
      processed: !!matchingTruck,
    }

    const { data: event, error } = await supabaseAdmin
      .from('camera_events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Error creating camera event:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          event,
          matched: !!matchingTruck,
          matchedTruck: matchingTruck || null,
          confidence: 0.85,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/yard/camera:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
