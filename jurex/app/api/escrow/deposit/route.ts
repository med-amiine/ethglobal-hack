import { NextRequest, NextResponse } from "next/server";
import { updateData, getEntry } from "@/lib/data";
import { getPublicClient } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * POST /api/escrow/deposit
 * Lock USDC in escrow via TaskEscrow contract
 * Body: { caseId, clientAddress, amountUSDC }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, clientAddress, amountUSDC } = body;

    // Validate
    if (!caseId || !clientAddress || !amountUSDC) {
      return NextResponse.json(
        { error: "Missing required fields: caseId, clientAddress, amountUSDC" },
        { status: 400 }
      );
    }

    if (typeof amountUSDC !== "number" || amountUSDC <= 0) {
      return NextResponse.json(
        { error: "amountUSDC must be a positive number" },
        { status: 400 }
      );
    }

    // Check if already locked
    const existing = getEntry("escrow", String(caseId));
    if (existing && (existing as any).locked) {
      return NextResponse.json(
        { error: "Escrow already locked for this case" },
        { status: 400 }
      );
    }

    // Store in escrow.json
    const amountWei = Math.floor(amountUSDC * 1e6); // USDC has 6 decimals
    updateData("escrow", String(caseId), {
      amount: amountWei,
      amountUSDC,
      client: clientAddress,
      locked: true,
      released: false,
      createdAt: new Date().toISOString(),
    });

    console.log(
      `✅ Escrow locked for case ${caseId}: ${amountUSDC} USDC from ${clientAddress}`
    );

    return NextResponse.json(
      {
        success: true,
        caseId,
        amountUSDC,
        amountWei,
        message: "Escrow locked. Await on-chain TaskEscrow.lockFunds() call.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Escrow deposit error:", e);
    return NextResponse.json(
      { error: e.message || "Deposit failed" },
      { status: 500 }
    );
  }
}
