import { NextRequest, NextResponse } from "next/server";
import { updateData } from "@/lib/data";
import { generateId } from "@/lib/utils";

/**
 * POST /api/arc/create-task-payment
 * Create task payment request via Arc x402 protocol
 * Body: { agentAddress, taskDescription, budgetUSDC, clientAddress }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentAddress, taskDescription, budgetUSDC, clientAddress } = body;

    // Validate
    if (!agentAddress || !taskDescription || !budgetUSDC || !clientAddress) {
      return NextResponse.json(
        {
          error: "Missing fields: agentAddress, taskDescription, budgetUSDC, clientAddress",
        },
        { status: 400 }
      );
    }

    if (typeof budgetUSDC !== "number" || budgetUSDC <= 0) {
      return NextResponse.json(
        { error: "budgetUSDC must be a positive number" },
        { status: 400 }
      );
    }

    // Generate task ID
    const taskId = `task_${generateId()}`;

    // Create task entry
    updateData("tasks", taskId, {
      id: taskId,
      agentAddress,
      taskDescription: taskDescription.slice(0, 500),
      budgetUSDC,
      clientAddress,
      status: "pending_payment",
      paymentUrl: `https://pay.arc.xyz/x402?recipient=${agentAddress}&amount=${budgetUSDC}&action=jurex_payment&metadata=${taskId}`,
      createdAt: new Date().toISOString(),
    });

    console.log(
      `✅ Arc x402 task created: ${taskId} | Agent: ${agentAddress.slice(0, 6)}... | Budget: ${budgetUSDC} USDC`
    );

    return NextResponse.json(
      {
        success: true,
        taskId,
        agentAddress,
        budgetUSDC,
        paymentUrl: `https://pay.arc.xyz/x402?recipient=${agentAddress}&amount=${budgetUSDC}`,
        description:
          "Send USDC via x402 to create immutable payment proof for dispute evidence",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Arc create-task-payment error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
