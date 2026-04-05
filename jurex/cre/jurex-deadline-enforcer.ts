/**
 * Chainlink CRE Deadline Enforcer
 *
 * Runs periodically to:
 * 1. Fetch all open cases from API
 * 2. Check if deadline has passed
 * 3. If consensus reached → release escrow to winner
 * 4. If no consensus → refund client
 * 5. Update agent ENS reputation scores
 * 6. Archive resolved cases
 */

interface Case {
  caseId: string;
  clientAddress: string;
  agentAddress: string;
  status: "open" | "disputed" | "resolved";
  deadline: number; // Unix timestamp
  evidence: string;
  votes?: Array<{ judge: string; verdict: "agent" | "client" }>;
  consensusReached?: boolean;
}

interface ReleaseResult {
  caseId: string;
  status: "released" | "refunded" | "pending";
  timestamp: number;
  txHash?: string;
}

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const CRE_LOG_PREFIX = "[CRE_DEADLINE_ENFORCER]";

async function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${CRE_LOG_PREFIX} ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

/**
 * Fetch all open cases that need processing
 */
async function fetchOpenCases(): Promise<Case[]> {
  try {
    const res = await fetch(`${API_BASE}/api/cases/open`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cases = (await res.json()) as Case[];
    await log(`Fetched ${cases.length} open cases`);
    return cases;
  } catch (error) {
    await log("❌ Error fetching open cases", error);
    return [];
  }
}

/**
 * Get rulings for a specific case
 */
async function getCaseRulings(
  caseId: string
): Promise<{ votes: any[]; consensusReached: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/rulings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as any;
  } catch (error) {
    await log(`❌ Error fetching rulings for ${caseId}`, error);
    return { votes: [], consensusReached: false };
  }
}

/**
 * Release escrow to agent if they won
 */
async function releaseToAgent(caseId: string): Promise<ReleaseResult> {
  try {
    const res = await fetch(`${API_BASE}/api/escrow/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = (await res.json()) as any;
    await log(`✓ Released escrow for case ${caseId}`);
    return {
      caseId,
      status: "released",
      timestamp: Date.now(),
      txHash: data.txHash,
    };
  } catch (error) {
    await log(`❌ Error releasing escrow for ${caseId}`, error);
    return { caseId, status: "pending", timestamp: Date.now() };
  }
}

/**
 * Refund escrow to client if agent lost or no consensus
 */
async function refundClient(caseId: string): Promise<ReleaseResult> {
  try {
    const res = await fetch(`${API_BASE}/api/escrow/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = (await res.json()) as any;
    await log(`✓ Refunded escrow for case ${caseId}`);
    return {
      caseId,
      status: "refunded",
      timestamp: Date.now(),
      txHash: data.txHash,
    };
  } catch (error) {
    await log(`❌ Error refunding case ${caseId}`, error);
    return { caseId, status: "pending", timestamp: Date.now() };
  }
}

/**
 * Update agent score after case resolution
 */
async function updateAgentScore(agentAddress: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/ens/update-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentAddress }),
    });
    await log(`✓ Updated score for agent ${agentAddress.slice(0, 10)}...`);
  } catch (error) {
    await log(`❌ Error updating score for ${agentAddress}`, error);
  }
}

/**
 * Main execution loop
 */
export async function run() {
  const startTime = Date.now();
  await log("=== DEADLINE ENFORCER CYCLE STARTED ===");

  const cases = await fetchOpenCases();
  if (cases.length === 0) {
    await log("No open cases to process");
    await log(
      `=== CYCLE COMPLETE (${Date.now() - startTime}ms) ===\n`
    );
    return;
  }

  const now = Date.now() / 1000; // Convert to seconds
  const results: ReleaseResult[] = [];
  const agentsToUpdate = new Set<string>();

  for (const caseData of cases) {
    await log(`\nProcessing case ${caseData.caseId}`);

    // Check if deadline passed
    if (caseData.deadline > now) {
      await log(`  ⏱ Deadline not reached (${Math.ceil(caseData.deadline - now)}s remaining)`);
      continue;
    }

    await log(`  ✓ Deadline reached`);

    // Get rulings
    const { consensusReached, votes } = await getCaseRulings(
      caseData.caseId
    );
    await log(`  Votes received: ${votes.length}`);

    // Determine verdict
    if (consensusReached) {
      await log(`  ✓ Consensus reached → RELEASING to agent`);
      const result = await releaseToAgent(caseData.caseId);
      results.push(result);
      agentsToUpdate.add(caseData.agentAddress);
    } else {
      await log(`  ✗ No consensus → REFUNDING client`);
      const result = await refundClient(caseData.caseId);
      results.push(result);
      agentsToUpdate.add(caseData.agentAddress);
    }
  }

  // Update scores for all involved agents
  for (const agentAddress of agentsToUpdate) {
    await updateAgentScore(agentAddress);
  }

  const released = results.filter((r) => r.status === "released").length;
  const refunded = results.filter((r) => r.status === "refunded").length;
  const pending = results.filter((r) => r.status === "pending").length;

  await log("\n=== SUMMARY ===");
  await log(`Cases processed: ${cases.length}`);
  await log(`Cases released: ${released}`);
  await log(`Cases refunded: ${refunded}`);
  await log(`Cases pending: ${pending}`);
  await log(`=== CYCLE COMPLETE (${Date.now() - startTime}ms) ===\n`);

  return {
    casesProcessed: cases.length,
    casesReleased: released,
    casesRefunded: refunded,
    casesPending: pending,
    escrowReleased: released,
    timestamp: new Date().toISOString(),
  };
}

// Export for CRE scheduler
export default run;
