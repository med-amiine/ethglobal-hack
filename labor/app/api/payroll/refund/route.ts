import { NextRequest, NextResponse } from 'next/server'
import { refundRemaining } from '@/lib/payroll'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const result = await refundRemaining(jobId)

    return NextResponse.json({
      success: result.success,
      refundAmount: result.amount,
      note: 'Remaining budget refunded to employer',
    })
  } catch (error) {
    console.error('Error refunding payroll:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refund' },
      { status: 500 }
    )
  }
}
