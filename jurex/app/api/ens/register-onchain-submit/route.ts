import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  encodeFunctionData,
  isAddress,
} from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACTS } from "@/lib/contracts";
import { updateData } from "@/lib/data";

/**
 * POST /api/ens/register-onchain-submit
 * Submit agent registration and verify on-chain
 * Body: { agentName, address, transactionHash }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentName, address, transactionHash } = body;

    console.log("Verifying registration:", {
      agentName,
      address,
      txHash: transactionHash?.slice(0, 10) + "...",
    });

    // Validate inputs
    if (!agentName || !address || !transactionHash) {
      return NextResponse.json(
        {
          error: "Missing required fields: agentName, address, transactionHash",
        },
        { status: 400 }
      );
    }

    if (!isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address" },
        { status: 400 }
      );
    }

    if (!transactionHash.startsWith("0x") || transactionHash.length !== 66) {
      return NextResponse.json(
        { error: "Invalid transaction hash format" },
        { status: 400 }
      );
    }

    // Verify transaction on Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    console.log("Fetching transaction receipt...");
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Transaction not found on Base Sepolia. Wait a moment and try again." },
        { status: 404 }
      );
    }

    console.log("Receipt status:", receipt.status);

    if (receipt.status === "reverted") {
      // Try to get revert reason
      const tx = await publicClient.getTransaction({
        hash: transactionHash as `0x${string}`,
      });

      return NextResponse.json(
        {
          error: `Transaction reverted on-chain. Check contract address and parameters.`,
          details: {
            status: receipt.status,
            to: receipt.to,
            from: receipt.from,
            gasUsed: receipt.gasUsed?.toString(),
          },
        },
        { status: 400 }
      );
    }

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: `Transaction status: ${receipt.status}` },
        { status: 400 }
      );
    }

    // Verify the transaction was to the CourtRegistry contract
    if (
      receipt.to?.toLowerCase() !==
      CONTRACTS.CourtRegistry.address.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `Transaction sent to wrong contract. Expected: ${CONTRACTS.CourtRegistry.address}`,
        },
        { status: 400 }
      );
    }

    // Store agent in database (JSON file)
    updateData("ens-registry", agentName.toLowerCase(), {
      name: agentName.toLowerCase(),
      address: address.toLowerCase(),
      erc8004Score: 500,
      casesWon: 0,
      casesLost: 0,
      registeredAt: new Date().toISOString(),
      transactionHash: transactionHash,
      registeredOnChain: true,
    });

    console.log(
      `✅ Agent verified and stored: ${agentName}.jurex.eth | TxHash: ${transactionHash}`
    );

    return NextResponse.json(
      {
        success: true,
        ensName: `${agentName}.jurex.eth`,
        address: address.toLowerCase(),
        transactionHash,
        erc8004Score: 500,
        message: "Agent successfully registered on-chain and verified",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Registration verification error:", e);
    return NextResponse.json(
      {
        error: e.message || "Failed to verify registration",
        details: e.toString(),
      },
      { status: 500 }
    );
  }
}
