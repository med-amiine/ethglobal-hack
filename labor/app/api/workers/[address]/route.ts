import { NextRequest, NextResponse } from 'next/server'
import { getReputation } from '@/lib/reputation'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address) {
      return NextResponse.json({ error: 'address required' }, { status: 400 })
    }

    const reputation = getReputation(address)

    return NextResponse.json({
      success: true,
      reputation,
    })
  } catch (error) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}
