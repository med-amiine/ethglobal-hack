import { NextRequest, NextResponse } from "next/server";
import { getEntry, updateData } from "@/lib/data";

/**
 * POST /api/ens/update-score
 * Update agent score after case resolution
 * Body: { agentName, newScore, caseResult: 'won' | 'lost' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentName, newScore, caseResult } = body;

    if (!agentName || !caseResult || !["won", "lost"].includes(caseResult)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Get agent
    const agent = getEntry("ens-registry", agentName.toLowerCase()) as any;
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Update
    const updated = {
      ...agent,
      erc8004Score: newScore || agent.erc8004Score,
      casesWon: agent.casesWon + (caseResult === "won" ? 1 : 0),
      casesLost: agent.casesLost + (caseResult === "lost" ? 1 : 0),
    };

    updateData("ens-registry", agentName.toLowerCase(), updated);

    console.log(
      `📈 ENS score updated: ${agentName}.jurex.eth | Score: ${updated.erc8004Score} | ${caseResult}`
    );

    return NextResponse.json(
      {
        success: true,
        agentName,
        erc8004Score: updated.erc8004Score,
        casesWon: updated.casesWon,
        casesLost: updated.casesLost,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("ENS update-score error:", e);
    return NextResponse.json(
      { error: e.message || "Update failed" },
      { status: 500 }
    );
  }
}
