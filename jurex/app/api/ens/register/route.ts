import { NextRequest, NextResponse } from "next/server";
import { updateData, getEntry } from "@/lib/data";
import { validateENSName } from "@/lib/ens";

/**
 * POST /api/ens/register
 * Register agent on jurex.eth offchain resolver
 * Body: { agentName, address, description, transactionHash (optional) }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentName, address, description, transactionHash } = body;

    // Validate
    if (!agentName || !address) {
      return NextResponse.json(
        { error: "Missing fields: agentName, address" },
        { status: 400 }
      );
    }

    if (!validateENSName(agentName)) {
      return NextResponse.json(
        { error: "Invalid ENS name. Must be 3-20 alphanumeric chars." },
        { status: 400 }
      );
    }

    // Check if already taken
    const existing = getEntry("ens-registry", agentName.toLowerCase());
    if (existing) {
      return NextResponse.json(
        { error: `${agentName}.jurex.eth is already registered` },
        { status: 400 }
      );
    }

    // Register
    updateData("ens-registry", agentName.toLowerCase(), {
      name: agentName.toLowerCase(),
      address,
      erc8004Score: 500,
      casesWon: 0,
      casesLost: 0,
      description: description?.slice(0, 200) || "",
      registeredAt: new Date().toISOString(),
      ...(transactionHash && { transactionHash }),
    });

    console.log(
      `✅ ENS registered: ${agentName}.jurex.eth → ${address.slice(0, 6)}...`
    );

    return NextResponse.json(
      {
        success: true,
        ensName: `${agentName}.jurex.eth`,
        address,
        erc8004Score: 500,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("ENS register error:", e);
    return NextResponse.json(
      { error: e.message || "Registration failed" },
      { status: 500 }
    );
  }
}
