import { NextRequest, NextResponse } from 'next/server'
import { submitCheckIn } from '@/lib/hedera'
import { releaseDayPay } from '@/lib/payroll'

export async function POST(req: NextRequest) {
  try {
    const { jobId, topicId, workerId, action } = await req.json()

    if (!jobId || !topicId || !workerId || !action) {
      return NextResponse.json(
        { error: 'jobId, topicId, workerId, and action required' },
        { status: 400 }
      )
    }

    if (action !== 'checkin' && action !== 'checkout') {
      return NextResponse.json(
        { error: 'action must be "checkin" or "checkout"' },
        { status: 400 }
      )
    }

    // Submit to Hedera HCS
    const hcsResult = await submitCheckIn(topicId, {
      workerId,
      jobId,
      timestamp: Date.now(),
      type: action,
    })

    // If checkout, trigger payment release
    let paymentTriggered = false
    if (action === 'checkout') {
      try {
        await releaseDayPay(jobId, workerId)
        paymentTriggered = true
      } catch (paymentErr) {
        console.warn('Payment release failed (may be out of budget):', paymentErr)
      }
    }

    return NextResponse.json({
      success: true,
      action,
      hcsSequenceNumber: hcsResult.sequenceNumber,
      transactionId: hcsResult.transactionId,
      hashscanUrl: hcsResult.hashscanUrl,
      paymentTriggered,
    })
  } catch (error) {
    console.error('Error submitting check-in:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit check-in' },
      { status: 500 }
    )
  }
}
