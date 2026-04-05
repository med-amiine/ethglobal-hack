import { NextResponse } from "next/server";
import { getAll } from "@/lib/data";

/**
 * GET /api/agents
 * Get all registered agents from ENS registry
 */
export async function GET() {
  try {
    const agents = getAll("ens-registry");

    return NextResponse.json(
      {
        success: true,
        count: agents.length,
        agents,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Get agents error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to get agents" },
      { status: 500 }
    );
  }
}
