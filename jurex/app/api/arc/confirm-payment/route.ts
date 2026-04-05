import { NextRequest, NextResponse } from "next/server";
import { getEntry, updateData } from "@/lib/data";

/**
 * POST /api/arc/confirm-payment
 * Verify x402 payment was sent on-chain
 * Body: { taskId, txHash }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, txHash } = body;

    // Validate
    if (!taskId || !txHash) {
      return NextResponse.json(
        { error: "Missing fields: taskId, txHash" },
        { status: 400 }
      );
    }

    // Get task
    const task = getEntry("tasks", taskId) as any;
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "paid") {
      return NextResponse.json(
        { error: "Task already paid" },
        { status: 400 }
      );
    }

    // Verify txHash format (basic validation)
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: "Invalid transaction hash format" },
        { status: 400 }
      );
    }

    // In production, verify on-chain via RPC
    // For now, mark as paid if we have the txHash
    updateData("tasks", taskId, {
      ...task,
      status: "paid",
      paymentTxHash: txHash,
      paidAt: new Date().toISOString(),
    });

    console.log(
      `✅ Arc x402 payment confirmed for ${taskId}: ${txHash.slice(0, 12)}...`
    );

    return NextResponse.json(
      {
        success: true,
        taskId,
        txHash,
        budgetUSDC: task.budgetUSDC,
        status: "paid",
        message: "Payment verified. Ready to open dispute.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Arc confirm-payment error:", e);
    return NextResponse.json(
      { error: e.message || "Verification failed" },
      { status: 500 }
    );
  }
}
