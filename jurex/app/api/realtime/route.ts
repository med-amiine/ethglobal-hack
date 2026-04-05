import { NextResponse } from "next/server";
import { startAlchemyListener, startDRPCListener } from "@/lib/alchemy-listener";
import { publishEvent, CHANNELS, EVENTS } from "@/lib/realtime";

let listenerStarted = false;

// Start listener on first request
async function ensureListener() {
  if (!listenerStarted) {
    startAlchemyListener();
    await startDRPCListener();
    listenerStarted = true;
  }
}

export async function GET() {
  await ensureListener();

  return NextResponse.json({
    status: "listening",
    timestamp: Date.now(),
    services: ["alchemy", "drpc", "ably"],
  });
}

// Webhook endpoint for external services
export async function POST(req: Request) {
  await ensureListener();

  try {
    const body = await req.json();

    switch (body.type) {
      case "case_update": {
        const { caseId, ...data } = body;
        if (caseId) {
          await publishEvent(CHANNELS.caseSpecific(caseId), EVENTS.CASE_UPDATED, { ...data, timestamp: Date.now() });
          await publishEvent(CHANNELS.cases, EVENTS.CASE_UPDATED, { caseId, ...data, timestamp: Date.now() });
        }
        return NextResponse.json({ received: true, type: "case_update", published: !!caseId });
      }

      case "agent_update": {
        const { agentId, ...data } = body;
        if (agentId) {
          await publishEvent(CHANNELS.agentSpecific(agentId), EVENTS.REPUTATION_UPDATED, { ...data, timestamp: Date.now() });
          await publishEvent(CHANNELS.agents, EVENTS.REPUTATION_UPDATED, { agentId, ...data, timestamp: Date.now() });
        }
        return NextResponse.json({ received: true, type: "agent_update", published: !!agentId });
      }

      default:
        return NextResponse.json({ received: true, type: "unknown" });
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
