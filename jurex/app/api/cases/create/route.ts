import { NextRequest, NextResponse } from "next/server";
import { updateData } from "@/lib/data";

/**
 * POST /api/cases/create
 * Create a new case when task is created
 * Body: { caseId, clientAddress, agentAddress, taskDescription }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, clientAddress, agentAddress, taskDescription } = body;

    // Validate
    if (!caseId || !clientAddress || !agentAddress || !taskDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create case
    updateData("cases", caseId, {
      id: caseId,
      clientAddress,
      agentAddress,
      taskDescription: taskDescription.slice(0, 500),
      status: "open",
      votes: [],
      clientVotes: 0,
      agentVotes: 0,
      resolved: false,
      createdAt: new Date().toISOString(),
    });

    console.log(`📋 Case created: ${caseId} | Agent: ${agentAddress.slice(0, 6)}... | Client: ${clientAddress.slice(0, 6)}...`);

    return NextResponse.json(
      {
        success: true,
        caseId,
        clientAddress,
        agentAddress,
        status: "open",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Case creation error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to create case" },
      { status: 500 }
    );
  }
}
