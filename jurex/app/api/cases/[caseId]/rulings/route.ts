import { NextRequest, NextResponse } from "next/server";
import { getEntry } from "@/lib/data";

/**
 * GET /api/cases/[caseId]/rulings
 * Get all votes on a case (anonymized)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { caseId } = params;

    // Get case
    const caseData = (getEntry("cases", caseId) as any) || {
      votes: [],
      clientVotes: 0,
      agentVotes: 0,
      resolved: false,
    };

    return NextResponse.json(
      {
        success: true,
        caseId,
        votes: caseData.votes || [],
        clientVotes: caseData.clientVotes || 0,
        agentVotes: caseData.agentVotes || 0,
        totalVotes: (caseData.votes || []).length,
        resolved: caseData.resolved || false,
        winner: caseData.winner || null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Get rulings error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to get rulings" },
      { status: 500 }
    );
  }
}
