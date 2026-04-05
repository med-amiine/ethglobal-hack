import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    const { paymentId, txHash } = await req.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    const result = await confirmPayment(paymentId, txHash)

    return NextResponse.json({
      success: result.success,
      confirmed: result.confirmed,
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const paymentId = url.pathname.split('/').pop()

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    // For GET, redirect to confirm page or return status
    return NextResponse.json({
      message: 'Use POST to confirm payment',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
