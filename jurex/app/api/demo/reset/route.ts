import { NextRequest, NextResponse } from "next/server";
import { clearData } from "@/lib/data";

/**
 * POST /api/demo/reset
 * Clear all data (demo mode only)
 * Protected by DEMO_MODE env var
 */
export async function POST(req: NextRequest) {
  // Safety check
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo mode not enabled" },
      { status: 403 }
    );
  }

  try {
    // Clear all data files
    clearData("escrow");
    clearData("tasks");
    clearData("judges");
    clearData("ens-registry");
    clearData("cases");
    clearData("agents");

    console.log("🔄 Demo data reset");

    return NextResponse.json(
      {
        success: true,
        message: "All data cleared. Ready for fresh demo run.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Demo reset error:", e);
    return NextResponse.json(
      { error: e.message || "Reset failed" },
      { status: 500 }
    );
  }
}
