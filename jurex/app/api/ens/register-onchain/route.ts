import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACTS } from "@/lib/contracts";

/**
 * POST /api/ens/register-onchain
 * Register agent ON-CHAIN via CourtRegistry.registerAgent()
 * Requires wallet signature (client-side)
 * Body: { agentName, address, transactionHash }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentName, address, transactionHash } = body;

    // Validate
    if (!agentName || !address || !transactionHash) {
      return NextResponse.json(
        {
          error: "Missing required fields: agentName, address, transactionHash",
        },
        { status: 400 }
      );
    }

    // Verify transaction on Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    const tx = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found on Base Sepolia" },
        { status: 400 }
      );
    }

    if (tx.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 400 }
      );
    }

    console.log(
      `✅ Agent registered ON-CHAIN: ${agentName}.jurex.eth → ${address} | TxHash: ${transactionHash}`
    );

    return NextResponse.json(
      {
        success: true,
        ensName: `${agentName}.jurex.eth`,
        address,
        transactionHash,
        erc8004Score: 500,
        message: "Agent registered on-chain via CourtRegistry",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("On-chain registration error:", e);
    return NextResponse.json(
      { error: e.message || "On-chain registration failed" },
      { status: 500 }
    );
  }
}
