import { NextRequest, NextResponse } from "next/server";
import { getEntry, updateData } from "@/lib/data";

/**
 * POST /api/cases/[caseId]/rule
 * Submit judge vote on case
 * Body: { nullifierHash, caseId, ruling: 'client' | 'agent' }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const body = await req.json();
    const { nullifierHash, ruling } = body;
    const { caseId } = params;

    // Validate
    if (!nullifierHash || !ruling || !["client", "agent"].includes(ruling)) {
      return NextResponse.json(
        { error: "Invalid ruling. Must be 'client' or 'agent'" },
        { status: 400 }
      );
    }

    // Check judge is verified
    const judge = getEntry("judges", nullifierHash) as any;
    if (!judge || !judge.verified) {
      return NextResponse.json(
        { error: "Judge not verified with World ID" },
        { status: 403 }
      );
    }

    // Get case
    let caseData = (getEntry("cases", caseId) as any) || {
      id: caseId,
      votes: [],
      clientVotes: 0,
      agentVotes: 0,
      resolved: false,
    };

    // Check if already voted
    const alreadyVoted = caseData.votes?.some(
      (v: any) => v.nullifierHash === nullifierHash
    );
    if (alreadyVoted) {
      return NextResponse.json(
        { error: "Judge already voted on this case" },
        { status: 400 }
      );
    }

    // Record vote
    const vote = {
      nullifierHash: nullifierHash.slice(0, 6) + "...", // Anonymize
      ruling,
      timestamp: new Date().toISOString(),
    };

    caseData.votes = (caseData.votes || []).concat(vote);
    if (ruling === "client") {
      caseData.clientVotes = (caseData.clientVotes || 0) + 1;
    } else {
      caseData.agentVotes = (caseData.agentVotes || 0) + 1;
    }

    // Check for 2/3 consensus (3 judges total)
    const totalVotes = caseData.votes.length;
    if (totalVotes >= 2) {
      if (caseData.clientVotes >= 2) {
        caseData.resolved = true;
        caseData.winner = "client";
      } else if (caseData.agentVotes >= 2) {
        caseData.resolved = true;
        caseData.winner = "agent";
      }
    }

    // Save case
    updateData("cases", caseId, caseData);

    console.log(
      `⚖️  Vote recorded for case ${caseId}: ${ruling} | Votes: ${caseData.clientVotes}-${caseData.agentVotes}`
    );

    return NextResponse.json(
      {
        success: true,
        caseId,
        vote: ruling,
        voteCount: totalVotes,
        clientVotes: caseData.clientVotes,
        agentVotes: caseData.agentVotes,
        resolved: caseData.resolved,
        winner: caseData.winner || null,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Judge rule error:", e);
    return NextResponse.json(
      { error: e.message || "Vote failed" },
      { status: 500 }
    );
  }
}
