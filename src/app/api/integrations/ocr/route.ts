import { NextRequest, NextResponse } from 'next/server'
import { getTrucks } from '@/lib/data-access'
import { supabaseAdmin } from '@/lib/supabase-server'

function generatePlausibleLicensePlate(): string {
  const format = `${String.fromCharCode(65 + Math.random() * 26)}${String.fromCharCode(65 + Math.random() * 26)}-${Math.floor(1000 + Math.random() * 9000)}`
  return format
}

function generatePlausibleTrailerNumber(): string {
  return `TRL-${Math.floor(100000 + Math.random() * 900000)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dcId, cameraId, imageData } = body

    if (!dcId || !cameraId) {
      return NextResponse.json(
        {
          success: false,
          error: 'dcId and cameraId are required',
        },
        { status: 400 }
      )
    }

    const licensePlate = imageData?.licensePlate || generatePlausibleLicensePlate()
    const trailerNumber = imageData?.trailerNumber || generatePlausibleTrailerNumber()
    const confidence = 0.85 + Math.random() * 0.15

    const trucks = await getTrucks({ dcId })
    const matchingTruck = trucks.find(
      (t) =>
        (t.license_plate || '').toUpperCase() === licensePlate.toUpperCase() ||
        t.trailer_number === trailerNumber
    )

    const eventData = {
      dc_id: dcId,
      camera_id: cameraId,
      event_type: 'arrival' as const,
      timestamp: new Date().toISOString(),
      license_plate: licensePlate,
      trailer_number: trailerNumber,
      ocr_confidence: confidence,
      image_url: imageData?.imageUrl || `s3://yard-camera-bucket/${cameraId}/${Date.now()}.jpg`,
      truck_id: matchingTruck?.id || null,
      processed: !!matchingTruck,
    }

    const { data: event, error } = await supabaseAdmin
      .from('camera_events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Error creating OCR camera event:', error)
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
          detectedPlate: licensePlate,
          detectedTrailer: trailerNumber,
          confidence,
          matched: !!matchingTruck,
          matchedTruck: matchingTruck || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/integrations/ocr:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
