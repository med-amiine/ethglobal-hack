import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    const { jobId, workerAddress, amountUSDC } = await req.json()

    if (!jobId || !workerAddress || !amountUSDC) {
      return NextResponse.json(
        { error: 'jobId, workerAddress, and amountUSDC required' },
        { status: 400 }
      )
    }

    const result = await createPayment(jobId, workerAddress, amountUSDC)

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
      qrCodeData: result.qrCodeData,
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}
