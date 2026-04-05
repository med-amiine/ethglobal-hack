import { NextRequest, NextResponse } from 'next/server'
import { releaseDayPay } from '@/lib/payroll'

export async function POST(req: NextRequest) {
  try {
    const { jobId, workerAddress } = await req.json()

    if (!jobId || !workerAddress) {
      return NextResponse.json(
        { error: 'jobId and workerAddress required' },
        { status: 400 }
      )
    }

    const result = await releaseDayPay(jobId, workerAddress)

    return NextResponse.json({
      success: result.success,
      amountReleased: result.amountReleased,
      daysWorked: result.daysWorked,
      note: 'Payment released via private Unlink transfer',
    })
  } catch (error) {
    console.error('Error releasing day pay:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to release payment' },
      { status: 500 }
    )
  }
}
