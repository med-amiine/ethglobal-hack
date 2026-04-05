import { getPublicClient } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACTS } from "./contracts";

/**
 * Attach evidence to a case via the contract
 * Evidence is stored as IPFS hash on-chain
 */
export async function attachEvidence(
  caseId: string,
  txHash: string,
  ipfsHash: string,
  description: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    // For now, just log and store metadata
    // In production, this would call the contract's submitEvidence()
    console.log(
      `📎 Evidence attached to case ${caseId}: ${ipfsHash.slice(0, 12)}...`
    );
    console.log(`   Type: ${description}`);
    console.log(`   x402 TX: ${txHash}`);

    return {
      success: true,
      transactionHash: txHash,
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
    };
  }
}

/**
 * Parse evidence hash from IPFS CID
 */
export function parseEvidenceHash(cid: string): {
  hash: string;
  isValid: boolean;
} {
  const isValidCID = /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^baf[a-zA-Z0-9]+$/.test(cid);
  return {
    hash: cid,
    isValid: isValidCID,
  };
}
