/**
 * Jurex Deadline Enforcer Simulator
 *
 * Single-iteration dry-run for demonstration purposes.
 * Executes one full cycle synchronously without external dependencies.
 *
 * Usage:
 *   npx ts-node cre/simulate.ts
 *   npm run cre:simulate
 */

import { promises as fs } from "fs";
import path from "path";

interface SimulatedCase {
  caseId: string;
  clientAddress: string;
  agentAddress: string;
  status: "open" | "disputed" | "resolved";
  deadline: number;
  evidence: string;
  votes: Array<{ judge: string; verdict: "agent" | "client" }>;
}

interface SimulationResult {
  casesProcessed: number;
  casesReleased: number;
  casesRefunded: number;
  escrowReleased: number;
  timestamp: string;
}

const DATA_DIR = path.join(process.cwd(), "data");

async function readDataFile(filename: string): Promise<any> {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeDataFile(filename: string, data: any): Promise<void> {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

function log(message: string, prefix = "[CRE_SIM]") {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${prefix} ${message}`);
}

/**
 * Simulate one cycle of deadline enforcement
 */
export async function simulateCycle(): Promise<SimulationResult> {
  log("=== JUREX DEADLINE ENFORCER SIMULATION ===", "[BOOT]");
  log("Reading case data from disk...", "[IO]");

  // Load all data
  const cases = await readDataFile("cases.json");
  const escrow = await readDataFile("escrow.json");
  const ens = await readDataFile("ens-registry.json");

  const caseList = Object.values(cases) as SimulatedCase[];
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  log(`Found ${caseList.length} cases in storage`, "[DATA]");
  log(`Current time: ${new Date(now * 1000).toISOString()}`, "[TIME]");

  let casesProcessed = 0;
  let casesReleased = 0;
  let casesRefunded = 0;

  // Process each case
  for (const caseData of caseList) {
    if (caseData.status === "resolved") {
      log(`⊘ Case ${caseData.caseId} already resolved`, "[SKIP]");
      continue;
    }

    casesProcessed++;
    log(`\n→ Processing ${caseData.caseId}`, "[CASE]");
    log(`  Deadline: ${new Date(caseData.deadline * 1000).toISOString()}`, "[TIME]");
    log(`  Status: ${caseData.status}`, "[STATE]");

    // Check deadline
    if (caseData.deadline > now) {
      const secondsRemaining = Math.ceil(caseData.deadline - now);
      log(`  ⏱ Not yet due (${secondsRemaining}s remaining)`, "[CHECK]");
      continue;
    }

    log(`  ✓ Deadline reached`, "[CHECK]");

    // Check consensus (2/3 majority)
    const agentVotes = caseData.votes.filter((v) => v.verdict === "agent")
      .length;
    const clientVotes = caseData.votes.filter((v) => v.verdict === "client")
      .length;
    const totalVotes = caseData.votes.length;

    log(
      `  Votes: Agent ${agentVotes}/${totalVotes}, Client ${clientVotes}/${totalVotes}`,
      "[TALLY]"
    );

    const consensusThreshold = Math.ceil((totalVotes * 2) / 3);
    const agentWins = agentVotes >= consensusThreshold;
    const clientWins = clientVotes >= consensusThreshold;

    if (!agentWins && !clientWins) {
      log(`  ❌ No consensus reached (threshold: ${consensusThreshold})`, "[VERDICT]");

      // Refund client
      if (escrow[caseData.caseId]) {
        escrow[caseData.caseId].released = true;
        escrow[caseData.caseId].releasedTo = caseData.clientAddress;
        escrow[caseData.caseId].releaseType = "refund";
        log(
          `  → Refunding ${escrow[caseData.caseId].amount} USDC to client`,
          "[ESCROW]"
        );
      }

      casesRefunded++;
    } else {
      log(
        `  ✅ Agent wins! (${agentVotes}/${consensusThreshold} votes)`,
        "[VERDICT]"
      );

      // Release to agent
      if (escrow[caseData.caseId]) {
        escrow[caseData.caseId].released = true;
        escrow[caseData.caseId].releasedTo = caseData.agentAddress;
        escrow[caseData.caseId].releaseType = "winner";
        log(
          `  → Releasing ${escrow[caseData.caseId].amount} USDC to agent`,
          "[ESCROW]"
        );

        // Update agent reputation
        const agentEnsEntry = Object.values(ens).find(
          (e: any) => e.address === caseData.agentAddress
        ) as any;
        if (agentEnsEntry) {
          agentEnsEntry.casesWon = (agentEnsEntry.casesWon || 0) + 1;
          agentEnsEntry.erc8004Score = Math.min(
            1000,
            (agentEnsEntry.erc8004Score || 500) + 50
          );
          log(
            `  → Updated ${agentEnsEntry.name} score to ${agentEnsEntry.erc8004Score}`,
            "[SCORE]"
          );
        }
      }

      casesReleased++;
    }

    // Mark case as resolved
    caseData.status = "resolved";
    log(`  ✓ Case archived`, "[DONE]");
  }

  // Write updated data
  log("\nWriting results to disk...", "[IO]");
  await writeDataFile("cases.json", cases);
  await writeDataFile("escrow.json", escrow);
  await writeDataFile("ens-registry.json", ens);

  // Summary
  log("\n=== SIMULATION COMPLETE ===", "[RESULT]");
  log(`Cases processed: ${casesProcessed}`, "[STAT]");
  log(`Cases released to agent: ${casesReleased}`, "[STAT]");
  log(`Cases refunded to client: ${casesRefunded}`, "[STAT]");
  log(
    `Total escrow moved: $${(casesProcessed * 100).toLocaleString()} USDC`,
    "[STAT]"
  );

  return {
    casesProcessed,
    casesReleased,
    casesRefunded,
    escrowReleased: casesReleased,
    timestamp: new Date().toISOString(),
  };
}

// CLI execution
if (require.main === module) {
  simulateCycle().catch(console.error);
}

export default simulateCycle;
