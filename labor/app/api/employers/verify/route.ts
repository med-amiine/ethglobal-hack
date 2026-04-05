import { NextRequest, NextResponse } from 'next/server'
import { verifyEmployerProof } from '@/lib/worldid'

export async function POST(req: NextRequest) {
  try {
    const { proof, merkleRoot, nullifierHash, verificationLevel, address } = await req.json()

    if (!proof || !merkleRoot || !nullifierHash || !address) {
      return NextResponse.json(
        { error: 'Missing required World ID proof fields' },
        { status: 400 }
      )
    }

    const result = await verifyEmployerProof(
      proof,
      merkleRoot,
      nullifierHash,
      verificationLevel || 'Orb',
      address
    )

    return NextResponse.json({
      success: true,
      verified: result.verified,
      address: result.address,
      nullifierHash: result.nullifierHash,
    })
  } catch (error) {
    console.error('Error verifying employer:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 400 }
    )
  }
}
