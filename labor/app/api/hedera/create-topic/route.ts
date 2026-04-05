import { NextRequest, NextResponse } from 'next/server'
import { createJobTopic } from '@/lib/hedera'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }

    const topicId = await createJobTopic(jobId)

    return NextResponse.json({ success: true, topicId })
  } catch (error) {
    console.error('Error creating Hedera topic:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create topic' },
      { status: 500 }
    )
  }
}
