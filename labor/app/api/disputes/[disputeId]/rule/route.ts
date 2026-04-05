import { NextRequest, NextResponse } from 'next/server'
import { submitRuling, getDispute, getDisputeRulings } from '@/lib/disputes'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params
    const { judge, decision } = await req.json()

    if (!disputeId || !judge || !decision) {
      return NextResponse.json(
        { error: 'disputeId, judge, and decision required' },
        { status: 400 }
      )
    }

    if (decision !== 'worker' && decision !== 'employer') {
      return NextResponse.json(
        { error: 'decision must be "worker" or "employer"' },
        { status: 400 }
      )
    }

    const result = submitRuling(disputeId, judge, decision)

    const dispute = getDispute(disputeId)
    const rulings = getDisputeRulings(disputeId)

    return NextResponse.json({
      success: result.success,
      resolved: result.resolved,
      resolution: result.resolution,
      dispute,
      rulingCount: rulings.length,
      rulings,
    })
  } catch (error) {
    console.error('Error submitting ruling:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit ruling' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params

    if (!disputeId) {
      return NextResponse.json({ error: 'disputeId required' }, { status: 400 })
    }

    const dispute = getDispute(disputeId)
    const rulings = getDisputeRulings(disputeId)

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      dispute,
      rulings,
      rulingCount: rulings.length,
    })
  } catch (error) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dispute' },
      { status: 500 }
    )
  }
}
