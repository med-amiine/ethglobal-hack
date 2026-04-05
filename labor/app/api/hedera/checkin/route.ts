import { NextRequest, NextResponse } from 'next/server'
import { submitCheckIn, CheckInPayload } from '@/lib/hedera'

export async function POST(req: NextRequest) {
  try {
    const { jobId, topicId, workerId, type, location } = await req.json()

    if (!jobId || !topicId || !workerId || !type) {
      return NextResponse.json(
        { error: 'jobId, topicId, workerId, and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'checkin' && type !== 'checkout') {
      return NextResponse.json(
        { error: 'type must be "checkin" or "checkout"' },
        { status: 400 }
      )
    }

    const payload: CheckInPayload = {
      workerId,
      jobId,
      timestamp: Date.now(),
      type,
      location,
    }

    const result = await submitCheckIn(topicId, payload)

    return NextResponse.json({
      success: true,
      sequenceNumber: result.sequenceNumber,
      transactionId: result.transactionId,
      hashscanUrl: result.hashscanUrl,
    })
  } catch (error) {
    console.error('Error submitting check-in to Hedera:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit check-in' },
      { status: 500 }
    )
  }
}
