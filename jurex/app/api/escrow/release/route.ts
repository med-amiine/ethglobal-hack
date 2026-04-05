import { NextRequest, NextResponse } from "next/server";
import { updateData, getEntry } from "@/lib/data";

/**
 * POST /api/escrow/release
 * Release funds to winner (called by CourtCaseFactory on verdict)
 * Body: { caseId, winnerAddress }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, winnerAddress } = body;

    // Validate
    if (!caseId || !winnerAddress) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, winnerAddress" },
        { status: 400 }
      );
    }

    // Get escrow
    const escrow = getEntry("escrow", String(caseId)) as any;
    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (!escrow.locked) {
      return NextResponse.json(
        { error: "Escrow not locked" },
        { status: 400 }
      );
    }

    if (escrow.released) {
      return NextResponse.json(
        { error: "Funds already released" },
        { status: 400 }
      );
    }

    // Update escrow
    updateData("escrow", String(caseId), {
      ...escrow,
      released: true,
      releasedTo: winnerAddress,
      releasedAt: new Date().toISOString(),
    });

    console.log(
      `✅ Escrow released for case ${caseId}: ${escrow.amountUSDC} USDC → ${winnerAddress}`
    );

    return NextResponse.json(
      {
        success: true,
        caseId,
        winner: winnerAddress,
        amountUSDC: escrow.amountUSDC,
        message: "Funds released to winner",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Escrow release error:", e);
    return NextResponse.json(
      { error: e.message || "Release failed" },
      { status: 500 }
    );
  }
}
