import { NextRequest, NextResponse } from "next/server";
import { updateData, getEntry } from "@/lib/data";

/**
 * POST /api/escrow/refund
 * Refund funds to client (called if dispute unresolved/deadlocked)
 * Body: { caseId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId } = body;

    // Validate
    if (!caseId) {
      return NextResponse.json(
        { error: "Missing required field: caseId" },
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
      refundedTo: escrow.client,
      refundedAt: new Date().toISOString(),
    });

    console.log(
      `♻️  Escrow refunded for case ${caseId}: ${escrow.amountUSDC} USDC → ${escrow.client}`
    );

    return NextResponse.json(
      {
        success: true,
        caseId,
        client: escrow.client,
        amountUSDC: escrow.amountUSDC,
        message: "Funds refunded to client",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Escrow refund error:", e);
    return NextResponse.json(
      { error: e.message || "Refund failed" },
      { status: 500 }
    );
  }
}
