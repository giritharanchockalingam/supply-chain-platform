import { NextRequest, NextResponse } from 'next/server'
import { getTruckById } from '@/lib/data-access'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dcId, truckId, dockId, eventType, bolId, productId, quantity, locationCode, userId } = body

    if (!dcId || !eventType || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'dcId, eventType, and userId are required',
        },
        { status: 400 }
      )
    }

    const truck = truckId ? await getTruckById(truckId) : null

    const eventData = {
      dc_id: dcId,
      truck_id: truckId || null,
      dock_id: dockId || null,
      event_type: eventType,
      bol_id: bolId || null,
      product_id: productId || null,
      quantity: quantity || 0,
      location_code: locationCode || '',
      user_id: userId,
      details: {
        timestamp: new Date().toISOString(),
        source: 'WMS',
      },
    }

    const { data: event, error } = await supabaseAdmin
      .from('wms_events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Error creating WMS event:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    const statusMap: Record<string, string> = {
      receipt: 'at_dock',
      putaway: 'unloading',
      pick: 'loading',
      ship: 'completed',
    }

    if (truckId && statusMap[eventType]) {
      await supabaseAdmin
        .from('trucks')
        .update({
          status: statusMap[eventType],
          updated_at: new Date().toISOString(),
        })
        .eq('id', truckId)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          event,
          truckUpdated: !!truck,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/integrations/wms:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
