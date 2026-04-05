import { NextRequest, NextResponse } from 'next/server'
import { getJobMessages } from '@/lib/hedera'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params

    if (!topicId) {
      return NextResponse.json({ error: 'topicId required' }, { status: 400 })
    }

    const messages = await getJobMessages(topicId)

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    })
  } catch (error) {
    console.error('Error fetching job log from Hedera:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch job log' },
      { status: 500 }
    )
  }
}
