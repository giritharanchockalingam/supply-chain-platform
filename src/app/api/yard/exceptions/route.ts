import { NextRequest, NextResponse } from 'next/server'
import { getYardExceptions } from '@/lib/data-access'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dcId = searchParams.get('dcId')
    const status = searchParams.get('status') || undefined

    if (!dcId) {
      return NextResponse.json(
        {
          success: false,
          error: 'dcId is required',
        },
        { status: 400 }
      )
    }

    const exceptions = await getYardExceptions(dcId, status)

    return NextResponse.json({
      success: true,
      data: exceptions,
      count: exceptions.length,
    })
  } catch (error) {
    console.error('Error in GET /api/yard/exceptions:', error)
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
    const { dcId, type, severity, truckId, description } = body

    if (!dcId || !type || !severity || !truckId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('yard_exceptions')
      .insert([
        {
          dc_id: dcId,
          type,
          severity,
          truck_id: truckId,
          description: description || '',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating exception:', error)
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
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/yard/exceptions:', error)
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
    const { id, status, assignedTo, resolution } = body

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'id and status are required',
        },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.assigned_to = assignedTo
      updates.resolution = resolution
    }

    const { error } = await supabaseAdmin
      .from('yard_exceptions')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating exception:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Exception updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/yard/exceptions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
