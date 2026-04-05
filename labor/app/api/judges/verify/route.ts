import { NextRequest, NextResponse } from 'next/server'
import { verifyJudgeProof } from '@/lib/worldid'

export async function POST(req: NextRequest) {
  try {
    const { proof, merkleRoot, nullifierHash, address } = await req.json()

    if (!proof || !merkleRoot || !nullifierHash || !address) {
      return NextResponse.json(
        { error: 'Missing required World ID proof fields' },
        { status: 400 }
      )
    }

    const result = await verifyJudgeProof(proof, merkleRoot, nullifierHash, address)

    return NextResponse.json({
      success: true,
      verified: result.verified,
      address: result.address,
      nullifierHash: result.nullifierHash,
    })
  } catch (error) {
    console.error('Error verifying judge:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 400 }
    )
  }
}
