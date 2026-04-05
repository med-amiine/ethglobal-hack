import Ably from "ably";

// Server-side Ably client (lazy — avoids throw at module load when key is missing)
let _ablyServer: Ably.Rest | null = null;
function getAblyServer(): Ably.Rest {
  if (!_ablyServer) {
    const key = process.env.ABLY_API_KEY;
    if (!key) throw new Error("ABLY_API_KEY is not set");
    _ablyServer = new Ably.Rest(key);
  }
  return _ablyServer;
}

// Channel names
export const CHANNELS = {
  cases: "jurex-network:cases",
  agents: "jurex-network:agents",
  validators: "jurex-network:validators",
  system: "jurex-network:system",
  caseSpecific: (caseId: string) => `jurex-network:case:${caseId}`,
  agentSpecific: (agentId: string) => `jurex-network:agent:${agentId}`,
};

// Event types
export const EVENTS = {
  CASE_CREATED: "CASE_CREATED",
  CASE_UPDATED: "CASE_UPDATED",
  EVIDENCE_SUBMITTED: "EVIDENCE_SUBMITTED",
  VOTE_CAST: "VOTE_CAST",
  VERDICT_RENDERED: "VERDICT_RENDERED",
  AGENT_REGISTERED: "AGENT_REGISTERED",
  REPUTATION_UPDATED: "REPUTATION_UPDATED",
  VALIDATOR_ASSIGNED: "VALIDATOR_ASSIGNED",
};

// Publish helper
export async function publishEvent(channel: string, event: string, data: unknown) {
  try {
    const ch = getAblyServer().channels.get(channel);
    await ch.publish(event, data);
    console.log(`[Ably] Published ${event} to ${channel}`);
  } catch (err) {
    console.error("[Ably] Publish error:", err);
  }
}
