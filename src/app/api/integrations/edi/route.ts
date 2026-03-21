import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, transactionType, documentNumber, rawData } = body

    if (!customerId || !transactionType || !documentNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId, transactionType, and documentNumber are required',
        },
        { status: 400 }
      )
    }

    const transactionData = {
      customer_id: customerId,
      transaction_type: transactionType,
      document_number: documentNumber,
      transaction_date: new Date().toISOString(),
      status: 'received' as const,
      raw_data: rawData || '',
      parsed_data: {},
      validation_errors: null,
    }

    const { data: transaction, error: txnError } = await supabaseAdmin
      .from('edi_transactions')
      .insert([transactionData])
      .select()
      .single()

    if (txnError) {
      console.error('Error creating EDI transaction:', txnError)
      return NextResponse.json(
        {
          success: false,
          error: txnError.message,
        },
        { status: 500 }
      )
    }

    const inventorySignalData = {
      customer_id: customerId,
      customer_name: customerId,
      product_id: 'SKU-001',
      location_id: 'LOC-001',
      location_name: 'Main Warehouse',
      source: 'edi' as const,
      reported_date: new Date().toISOString().split('T')[0],
      received_date: new Date().toISOString(),
      on_hand_quantity: Math.floor(Math.random() * 1000),
      sell_through_quantity: Math.floor(Math.random() * 500),
      on_order_quantity: Math.floor(Math.random() * 200),
      data_quality_score: 95,
      validation_status: 'valid' as const,
      validation_issues: '',
      raw_payload: JSON.stringify(rawData || {}),
    }

    const { data: signal } = await supabaseAdmin
      .from('inventory_signals')
      .insert([inventorySignalData])
      .select()
      .single()

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction,
          inventorySignal: signal,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/integrations/edi:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
