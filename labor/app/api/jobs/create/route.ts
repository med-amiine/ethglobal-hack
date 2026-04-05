import { NextRequest, NextResponse } from 'next/server'
import { createJob, setHederaTopic } from '@/lib/jobs'
import { createJobTopic } from '@/lib/hedera'
import { lockPayrollFunds } from '@/lib/payroll'

export async function POST(req: NextRequest) {
  try {
    const { employer, title, description, dailyRateUSDC, location, startDate, endDate, totalBudgetUSDC } =
      await req.json()

    if (
      !employer ||
      !title ||
      !dailyRateUSDC ||
      !location ||
      !startDate ||
      !endDate ||
      !totalBudgetUSDC
    ) {
      return NextResponse.json(
        { error: 'Missing required job fields' },
        { status: 400 }
      )
    }

    // Create job in JobRegistry
    const jobId = createJob(
      employer,
      title,
      description || '',
      dailyRateUSDC,
      location,
      startDate,
      endDate
    )

    // Create Hedera topic for this job
    let hederaTopicId = ''
    try {
      hederaTopicId = await createJobTopic(jobId)
      setHederaTopic(jobId, hederaTopicId)
    } catch (hcsErr) {
      console.warn('Failed to create Hedera topic:', hcsErr)
    }

    // Lock payroll funds privately via Unlink
    let unlinkAccountId = ''
    try {
      const payrollResult = await lockPayrollFunds(
        jobId,
        employer,
        totalBudgetUSDC,
        dailyRateUSDC
      )
      unlinkAccountId = payrollResult.unlinkAccountId
    } catch (payErr) {
      console.warn('Failed to lock payroll funds:', payErr)
    }

    return NextResponse.json({
      success: true,
      jobId,
      hederaTopicId,
      unlinkAccountId,
      message: 'Job created with private budget locked',
    })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create job' },
      { status: 500 }
    )
  }
}
