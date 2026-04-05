import { NextRequest, NextResponse } from 'next/server'
import { getJob, assignWorker } from '@/lib/jobs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const job = getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job,
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { worker } = await req.json()

    if (!jobId || !worker) {
      return NextResponse.json(
        { error: 'jobId and worker required' },
        { status: 400 }
      )
    }

    assignWorker(jobId, worker)
    const job = getJob(jobId)

    return NextResponse.json({
      success: true,
      job,
      message: 'Worker assigned to job',
    })
  } catch (error) {
    console.error('Error assigning worker:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign worker' },
      { status: 500 }
    )
  }
}
