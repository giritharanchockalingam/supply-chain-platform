import { NextRequest, NextResponse } from 'next/server'
import { getPlanningExceptions, resolveException } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || undefined
    const severity = searchParams.get('severity') || undefined
    const resolved = searchParams.get('resolved')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    let resolvedFilter: boolean | undefined = undefined
    if (resolved === 'true') resolvedFilter = true
    if (resolved === 'false') resolvedFilter = false

    const exceptions = await getPlanningExceptions({
      type: type,
      severity: severity,
      resolved: resolvedFilter,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: exceptions,
      count: exceptions.length,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/exceptions:', error)
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
    const { id, notes, resolvedBy } = body

    if (!id || !resolvedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'id and resolvedBy are required',
        },
        { status: 400 }
      )
    }

    const success = await resolveException(id, notes || '', resolvedBy)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to resolve exception',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Exception resolved successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/planning/exceptions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
