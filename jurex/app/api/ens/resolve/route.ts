import { NextRequest, NextResponse } from "next/server";
import { getEntry } from "@/lib/data";
import { extractAgentName } from "@/lib/ens";

/**
 * GET /api/ens/resolve?name=xxx.jurex.eth
 * Resolve agent ENS name to address and profile
 */
export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name") || "";

    if (!name) {
      return NextResponse.json(
        { error: "Query param 'name' required (e.g., giza.jurex.eth)" },
        { status: 400 }
      );
    }

    // Extract name from .jurex.eth format
    const agentName = extractAgentName(name).toLowerCase();

    // Look up
    const agent = getEntry("ens-registry", agentName);
    if (!agent) {
      return NextResponse.json(
        { error: `${name} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...agent,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("ENS resolve error:", e);
    return NextResponse.json(
      { error: e.message || "Resolution failed" },
      { status: 500 }
    );
  }
}
