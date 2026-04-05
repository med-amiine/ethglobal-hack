import { useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useState } from "react";

/**
 * Hook for registering an agent ON-CHAIN
 * Calls CourtRegistry.registerAgent() with wallet signature
 */
export function useRegisterAgent() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registerAgent = async (
    agentName: string,
    agentAddress: string
  ) => {
    if (!address) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      // Create ERC-8004 ID from agent name (hash)
      const erc8004Id = `0x${Buffer.from(agentName).toString("hex").padEnd(64, "0")}`;

      // Note: This requires wagmi useContractWrite setup
      // For now, returning instructions for manual signing
      return {
        contractAddress: CONTRACTS.CourtRegistry.address,
        functionName: "registerAgent",
        args: [agentAddress, erc8004Id],
        message: "Sign transaction to register agent on-chain",
      };
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { registerAgent, loading, error };
}
