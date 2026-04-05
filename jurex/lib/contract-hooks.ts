"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useBalance, useAccount } from "wagmi";
import { CONTRACTS, BASE_FEE, JRX_TOKEN } from "./contracts";
import { formatEther } from "viem";

// ============ Registry Hooks ============

export function useAgentProfile(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "getAgentProfile",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useReputation(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "getReputation",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useIsRisky(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "isRisky",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useIsBlacklisted(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "isBlacklisted",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useRegisteredAgentsCount() {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "getRegisteredAgentsCount"
  });
}

// ============ Factory Hooks ============

export function useAllCases() {
  return useReadContract({
    address: CONTRACTS.CourtCaseFactory.address,
    abi: CONTRACTS.CourtCaseFactory.abi,
    functionName: "getAllCases"
  });
}

export function useCasesByAgent(address: string | undefined) {
  const plaintiffResult = useReadContract({
    address: CONTRACTS.CourtCaseFactory.address,
    abi: CONTRACTS.CourtCaseFactory.abi,
    functionName: "getCasesByPlaintiff",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });

  const defendantResult = useReadContract({
    address: CONTRACTS.CourtCaseFactory.address,
    abi: CONTRACTS.CourtCaseFactory.abi,
    functionName: "getCasesByDefendant",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });

  return {
    plaintiffCases: (plaintiffResult.data as string[] | undefined) || [],
    defendantCases: (defendantResult.data as string[] | undefined) || [],
    isLoading: plaintiffResult.isLoading || defendantResult.isLoading
  };
}

export function useCaseCount() {
  return useReadContract({
    address: CONTRACTS.CourtCaseFactory.address,
    abi: CONTRACTS.CourtCaseFactory.abi,
    functionName: "getCaseCount"
  });
}

export function useBaseFee() {
  // BASE_FEE is a constant in CourtCaseTest.sol, not a public getter on the factory
  return { data: BASE_FEE };
}

// ============ Case Hooks ============

export function useCaseDetails(caseAddress: string | undefined) {
  const plaintiff = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "plaintiff",
    query: { enabled: !!caseAddress }
  });

  const defendant = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "defendant",
    query: { enabled: !!caseAddress }
  });

  const state = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "state",
    query: { enabled: !!caseAddress }
  });

  const plaintiffStake = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "plaintiffStake",
    query: { enabled: !!caseAddress }
  });

  const defendantStake = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "defendantStake",
    query: { enabled: !!caseAddress }
  });

  const claimDescription = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "claimDescription",
    query: { enabled: !!caseAddress }
  });

  const deadline = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "deadlineToRespond",
    query: { enabled: !!caseAddress }
  });

  const filedAt = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "filedAt",
    query: { enabled: !!caseAddress }
  });

  const resolvedAt = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "resolvedAt",
    query: { enabled: !!caseAddress }
  });

  const plaintiffWins = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "plaintiffWins",
    query: { enabled: !!caseAddress }
  });

  const judges = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "getJudges",
    query: { enabled: !!caseAddress }
  });

  const voteCount = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "getVoteCount",
    query: { enabled: !!caseAddress }
  });

  return {
    plaintiff,
    defendant,
    state,
    plaintiffStake,
    defendantStake,
    claimDescription,
    deadline,
    filedAt,
    resolvedAt,
    plaintiffWins,
    judges,
    voteCount,
    isLoading: plaintiff.isLoading || defendant.isLoading || state.isLoading
  };
}

// ============ Self-Registration Hook ============
// Uses the API endpoint (deployer signs) until on-chain selfRegister() is live.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api-service-sand.vercel.app";

export function useSelfRegister() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const selfRegister = async (address: string) => {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/agent/self-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { selfRegister, isPending, error };
}

// ============ Write Hooks ============

export function useFileCase() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const fileCase = async (
    defendant: string,
    claimDescription: string,
    evidenceHash: string
  ) => {
    const tx = await writeContractAsync({
      address: CONTRACTS.CourtCaseFactory.address,
      abi: CONTRACTS.CourtCaseFactory.abi,
      functionName: "fileNewCase",
      args: [defendant as `0x${string}`, claimDescription, evidenceHash],
      value: BASE_FEE * BigInt(2) // 2x base fee
    });
    return tx;
  };

  return { fileCase, isPending, error };
}

export function useRespondToCase() {
  const { writeContract, isPending, error } = useWriteContract();

  const respond = async (caseAddress: string) => {
    return writeContract({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "respondToCase",
      value: BASE_FEE
    });
  };

  return { respond, isPending, error };
}

export function useSubmitEvidence() {
  const { writeContract, isPending, error } = useWriteContract();

  const submit = async (caseAddress: string, ipfsHash: string) => {
    return writeContract({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "submitEvidence",
      args: [ipfsHash]
    });
  };

  return { submit, isPending, error };
}

export function useSubmitVote() {
  const { writeContract, isPending, error } = useWriteContract();

  const vote = async (caseAddress: string, plaintiffWins: boolean) => {
    return writeContract({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "submitVote",
      args: [plaintiffWins]
    });
  };

  return { vote, isPending, error };
}

export function useMissedDeadline() {
  const { writeContract, isPending, error } = useWriteContract();

  const trigger = async (caseAddress: string) => {
    return writeContract({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "missedDeadline"
    });
  };

  return { trigger, isPending, error };
}

export function useResolveAfterDeadline() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const resolve = async (caseAddress: string) => {
    return writeContractAsync({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "resolveAfterDeadline"
    });
  };

  return { resolve, isPending, error };
}

// ============ Utility Hooks ============

export function useEthBalance(address: string | undefined) {
  return useBalance({
    address: address as `0x${string}`,
    query: { enabled: !!address }
  });
}

// Format wei to ETH string
export function formatEth(wei: bigint | undefined): string {
  if (wei === undefined) return "0.0000 ETH";
  return `${formatEther(wei)} ETH`;
}

// Case state enum mapping
export const CASE_STATES = [
  "Filed",
  "Summoned",
  "Active",
  "Deliberating",
  "Resolved",
  "Dismissed",
  "Defaulted"
];

export function getCaseState(stateIndex: number | undefined): string {
  if (stateIndex === undefined) return "Unknown";
  return CASE_STATES[stateIndex] || "Unknown";
}

// ============ JRX Token Hooks ============

export function useJRXBalance(address: string | undefined) {
  return useReadContract({
    address: JRX_TOKEN.address,
    abi: JRX_TOKEN.abi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useLastDripAt(address: string | undefined) {
  return useReadContract({
    address: JRX_TOKEN.address,
    abi: JRX_TOKEN.abi,
    functionName: "lastDripAt",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useDripJRX() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();

  const drip = async (to?: string) => {
    const recipient = to || address;
    if (!recipient) throw new Error("No address provided");
    return writeContractAsync({
      address: JRX_TOKEN.address,
      abi: JRX_TOKEN.abi,
      functionName: "drip",
      args: [recipient as `0x${string}`]
    });
  };

  return { drip, isPending, error };
}

// ============ Judge Staking Hooks ============

export function useJudgeStake(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "judgeStakes",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });
}

export function useJudgePoolSize() {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "getJudgePoolSize"
  });
}

export function useJudgeStakeMin() {
  return useReadContract({
    address: CONTRACTS.CourtRegistry.address,
    abi: CONTRACTS.CourtRegistry.abi,
    functionName: "JUDGE_STAKE_MIN"
  });
}

export function useStakeAsJudge() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const stake = async (amount: bigint) => {
    // First approve JRX token spend, then stake
    return writeContractAsync({
      address: CONTRACTS.CourtRegistry.address,
      abi: CONTRACTS.CourtRegistry.abi,
      functionName: "stakeAsJudge",
      args: [amount]
    });
  };

  return { stake, isPending, error };
}

export function useApproveJRX() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const approve = async (spender: string, amount: bigint) => {
    return writeContractAsync({
      address: JRX_TOKEN.address,
      abi: JRX_TOKEN.abi,
      functionName: "approve",
      args: [spender as `0x${string}`, amount]
    });
  };

  return { approve, isPending, error };
}

export function useUnstakeJudge() {
  const { writeContract, isPending, error } = useWriteContract();

  const unstake = () => {
    return writeContract({
      address: CONTRACTS.CourtRegistry.address,
      abi: CONTRACTS.CourtRegistry.abi,
      functionName: "unstakeJudge"
    });
  };

  return { unstake, isPending, error };
}

// ============ Judge Assignment Hook ============

export function useAssignJudgesToCase() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const assignJudges = async (caseAddress: string) => {
    // Use block.timestamp-derived seed for pseudo-randomness
    const seed = BigInt(Date.now());
    return writeContractAsync({
      address: CONTRACTS.CourtCaseFactory.address,
      abi: CONTRACTS.CourtCaseFactory.abi,
      functionName: "assignJudgesToCase",
      args: [caseAddress as `0x${string}`, seed]
    });
  };

  return { assignJudges, isPending, error };
}

// ============ Appeal Hook ============

export function useAppealInfo(caseAddress: string | undefined) {
  const appealUsed = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "appealUsed",
    query: { enabled: !!caseAddress }
  });

  const verdictRenderedAt = useReadContract({
    address: caseAddress as `0x${string}`,
    abi: CONTRACTS.CourtCase.abi,
    functionName: "verdictRenderedAt",
    query: { enabled: !!caseAddress }
  });

  return { appealUsed, verdictRenderedAt };
}

export function useFileAppeal() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const fileAppeal = async (caseAddress: string) => {
    const APPEAL_BOND = BigInt("300000000000000"); // 0.0003 ETH
    return writeContractAsync({
      address: caseAddress as `0x${string}`,
      abi: CONTRACTS.CourtCase.abi,
      functionName: "fileAppeal",
      value: APPEAL_BOND
    });
  };

  return { fileAppeal, isPending, error };
}
