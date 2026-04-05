import { NextRequest, NextResponse } from 'next/server'
import { lockPayrollFunds } from '@/lib/payroll'

export async function POST(req: NextRequest) {
  try {
    const { jobId, employerAddress, totalBudgetUSDC, dailyRateUSDC } = await req.json()

    if (!jobId || !employerAddress || !totalBudgetUSDC || !dailyRateUSDC) {
      return NextResponse.json(
        { error: 'jobId, employerAddress, totalBudgetUSDC, and dailyRateUSDC required' },
        { status: 400 }
      )
    }

    const result = await lockPayrollFunds(
      jobId,
      employerAddress,
      totalBudgetUSDC,
      dailyRateUSDC
    )

    return NextResponse.json({
      success: result.success,
      unlinkAccountId: result.unlinkAccountId,
      note: 'Budget locked privately via Unlink',
    })
  } catch (error) {
    console.error('Error locking payroll funds:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to lock funds' },
      { status: 500 }
    )
  }
}
