import { NextRequest, NextResponse } from 'next/server'
import { openDispute } from '@/lib/disputes'

export async function POST(req: NextRequest) {
  try {
    const { jobId, reason, openedBy, opener } = await req.json()

    if (!jobId || !reason || !openedBy || !opener) {
      return NextResponse.json(
        { error: 'jobId, reason, openedBy, and opener required' },
        { status: 400 }
      )
    }

    if (openedBy !== 'worker' && openedBy !== 'employer') {
      return NextResponse.json(
        { error: 'openedBy must be "worker" or "employer"' },
        { status: 400 }
      )
    }

    const disputeId = openDispute(jobId, reason, openedBy, opener)

    return NextResponse.json({
      success: true,
      disputeId,
    })
  } catch (error) {
    console.error('Error opening dispute:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to open dispute' },
      { status: 500 }
    )
  }
}
