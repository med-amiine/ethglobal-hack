import { NextRequest, NextResponse } from "next/server";
import { getAll, getEntry, updateData } from "@/lib/data";

/**
 * POST /api/demo/run-cre
 * Simulate Chainlink CRE deadline enforcer workflow
 * Processes open cases and executes verdicts
 */
export async function POST(req: NextRequest) {
  try {
    const results = {
      casesProcessed: 0,
      casesResolved: 0,
      escrowReleased: 0,
      errors: [] as string[],
    };

    // Get all open cases
    const allCases = getAll("cases") as any[];
    const openCases = allCases.filter((c) => !c.resolved);

    console.log(`🔗 CRE: Processing ${openCases.length} open cases`);

    for (const caseData of openCases) {
      results.casesProcessed++;

      // Check if has consensus (2+ votes)
      if ((caseData.votes || []).length < 2) {
        console.log(
          `⏳ Case ${caseData.id}: Awaiting judge votes (${(caseData.votes || []).length}/2)`
        );
        continue;
      }

      // Determine winner
      if (caseData.clientVotes >= 2) {
        caseData.resolved = true;
        caseData.winner = "client";
      } else if (caseData.agentVotes >= 2) {
        caseData.resolved = true;
        caseData.winner = "agent";
      } else {
        continue;
      }

      // Release escrow
      const escrow = getEntry("escrow", caseData.id) as any;
      if (escrow && escrow.locked && !escrow.released) {
        escrow.released = true;
        escrow.releasedTo = caseData.winner;
        escrow.releasedAt = new Date().toISOString();
        updateData("escrow", caseData.id, escrow);
        results.escrowReleased++;

        console.log(
          `💸 Escrow released for ${caseData.id}: ${escrow.amountUSDC} USDC → ${caseData.winner}`
        );
      }

      // Update ENS scores
      // (Would update agent reputation here)

      // Save case
      updateData("cases", caseData.id, caseData);
      results.casesResolved++;

      console.log(
        `✅ Case ${caseData.id} resolved: ${caseData.winner} wins`
      );
    }

    console.log(
      `🔗 CRE: Complete | ${results.casesProcessed} processed | ${results.casesResolved} resolved`
    );

    return NextResponse.json(
      {
        success: true,
        ...results,
        message: `Chainlink CRE execution complete`,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("CRE execution error:", e);
    return NextResponse.json(
      { error: e.message || "CRE execution failed" },
      { status: 500 }
    );
  }
}
