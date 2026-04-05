import { NextResponse } from "next/server";
import { getAll } from "@/lib/data";

/**
 * GET /api/cases/open
 * Get all open/unresolved cases (for Chainlink CRE)
 */
export async function GET() {
  try {
    const allCases = getAll("cases") as any[];

    // Filter for open cases
    const openCases = allCases.filter(
      (c) => !c.resolved || c.resolved === false
    );

    return NextResponse.json(
      {
        success: true,
        count: openCases.length,
        cases: openCases,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Get open cases error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to get cases" },
      { status: 500 }
    );
  }
}
