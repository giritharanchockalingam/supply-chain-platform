import { NextRequest, NextResponse } from 'next/server'
import { getIngestionJobs } from '@/lib/data-access'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const jobs = await getIngestionJobs({
      status: status,
      customerId: customerId,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: jobs,
      count: jobs.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/intake:', error)
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
    const { sourceType, customerId, fileName, recordsTotal, recordsValid, recordsInvalid } = body

    if (!sourceType || !customerId || !fileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'sourceType, customerId, and fileName are required',
        },
        { status: 400 }
      )
    }

    const jobData = {
      source: sourceType,
      customer_id: customerId,
      customer_name: customerId,
      file_name: fileName,
      received_at: new Date().toISOString(),
      status: 'queued' as const,
      records_total: recordsTotal || 0,
      records_valid: recordsValid || 0,
      records_invalid: recordsInvalid || 0,
    }

    const { data: job, error } = await supabaseAdmin
      .from('ingestion_jobs')
      .insert([jobData])
      .select()
      .single()

    if (error) {
      console.error('Error creating ingestion job:', error)
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
        data: job,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/intake:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
