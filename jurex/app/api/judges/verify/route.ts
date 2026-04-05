import { NextRequest, NextResponse } from "next/server";
import { updateData, getEntry } from "@/lib/data";

/**
 * POST /api/judges/verify
 * Verify World ID proof and register judge
 * Body: { proof, merkleRoot, nullifierHash, verificationLevel, address }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nullifierHash, address, proof } = body;

    // Validate
    if (!nullifierHash || !address || !proof) {
      return NextResponse.json(
        { error: "Missing fields: nullifierHash, address, proof" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = getEntry("judges", nullifierHash) as any;
    if (existing && existing.verified) {
      return NextResponse.json(
        { success: true, message: "Judge already verified", judgeId: nullifierHash },
        { status: 200 }
      );
    }

    // In production, verify proof server-side with World ID API
    // For hackathon, accept proof if nullifierHash looks valid
    const isValidNullifier = /^0x[a-fA-F0-9]{64}$/.test(nullifierHash) ||
      /^[a-zA-Z0-9_-]{40,}$/.test(nullifierHash);

    if (!isValidNullifier) {
      return NextResponse.json(
        { error: "Invalid nullifier hash format" },
        { status: 400 }
      );
    }

    // Register judge
    updateData("judges", nullifierHash, {
      id: nullifierHash,
      address,
      nullifierHash,
      verified: true,
      verifiedAt: new Date().toISOString(),
      casesRuled: [],
      casesCorrect: 0,
    });

    console.log(
      `✅ Judge verified: ${nullifierHash.slice(0, 12)}... | Address: ${address.slice(0, 6)}...`
    );

    return NextResponse.json(
      {
        success: true,
        judgeId: nullifierHash,
        address,
        verified: true,
        message: "Judge registered. Ready to vote on cases.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Judge verify error:", e);
    return NextResponse.json(
      { error: e.message || "Verification failed" },
      { status: 500 }
    );
  }
}
