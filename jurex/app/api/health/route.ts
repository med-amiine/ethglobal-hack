import { NextResponse } from "next/server";
import { readData } from "@/lib/data";
import fs from "fs";
import path from "path";

/**
 * GET /api/health
 * Check system health and data file integrity
 */
export async function GET() {
  const checks: Record<string, boolean> = {};

  // Check data files exist
  const dataDir = path.join(process.cwd(), "data");
  const files = [
    "escrow.json",
    "tasks.json",
    "judges.json",
    "ens-registry.json",
    "cases.json",
    "agents.json",
  ];

  for (const file of files) {
    const filepath = path.join(dataDir, file);
    checks[`data_${file}`] = fs.existsSync(filepath);
  }

  // Check data can be read
  try {
    readData("escrow");
    checks.data_readable = true;
  } catch {
    checks.data_readable = false;
  }

  // Overall status
  const allGood = Object.values(checks).every((v) => v);

  return NextResponse.json(
    {
      status: allGood ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      message: allGood
        ? "All systems operational"
        : "Some checks failed - see details",
    },
    {
      status: allGood ? 200 : 503,
    }
  );
}
