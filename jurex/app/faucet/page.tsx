"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  useJRXBalance,
  useLastDripAt,
  useDripJRX,
  useJudgeStake,
  useJudgePoolSize,
  useJudgeStakeMin,
  useApproveJRX,
  useStakeAsJudge,
  useUnstakeJudge,
} from "@/lib/contract-hooks";
import { CONTRACTS, JRX_TOKEN } from "@/lib/contracts";

const DRIP_COOLDOWN = 24 * 60 * 60; // 24h in seconds
const JUDGE_STAKE_MIN_FALLBACK = BigInt("1000000000000000000000"); // 1,000 JRX

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [stakeInput, setStakeInput] = useState("1000");
  const [approveStep, setApproveStep] = useState(false);
  const [dripTx, setDripTx] = useState<string | null>(null);
  const [stakeTx, setStakeTx] = useState<string | null>(null);
  const [unstakeTx, setUnstakeTx] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: jrxBalance, refetch: refetchBalance } = useJRXBalance(address);
  const { data: lastDripAt } = useLastDripAt(address);
  const { data: judgeStake, refetch: refetchStake } = useJudgeStake(address);
  const { data: judgePoolSize } = useJudgePoolSize();
  const { data: judgeStakeMin } = useJudgeStakeMin();

  const { drip, isPending: isDripping } = useDripJRX();
  const { approve, isPending: isApproving } = useApproveJRX();
  const { stake, isPending: isStaking } = useStakeAsJudge();
  const { unstake, isPending: isUnstaking } = useUnstakeJudge();

  const nowSec = Math.floor(Date.now() / 1000);
  const lastDripSec = lastDripAt ? Number(lastDripAt) : 0;
  const cooldownRemaining = Math.max(0, lastDripSec + DRIP_COOLDOWN - nowSec);
  const canDrip = cooldownRemaining === 0;

  const jrxBalanceFormatted = jrxBalance ? parseFloat(formatEther(jrxBalance as bigint)).toFixed(0) : "0";
  const judgeStakeFormatted = judgeStake ? parseFloat(formatEther(judgeStake as bigint)).toFixed(0) : "0";
  const minStake = judgeStakeMin ? (judgeStakeMin as bigint) : JUDGE_STAKE_MIN_FALLBACK;
  const isEligibleJudge = judgeStake && (judgeStake as bigint) >= minStake;

  const handleDrip = async () => {
    setErrorMsg(null);
    try {
      const tx = await drip();
      setDripTx(tx as string);
      setTimeout(() => refetchBalance(), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Drip failed");
    }
  };

  const handleApprove = async () => {
    setErrorMsg(null);
    const amount = parseEther(stakeInput || "0");
    if (amount === BigInt(0)) {
      setErrorMsg("Enter an amount to stake");
      return;
    }
    try {
      await approve(CONTRACTS.CourtRegistry.address, amount);
      setApproveStep(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const handleStake = async () => {
    setErrorMsg(null);
    const amount = parseEther(stakeInput || "0");
    if (amount === BigInt(0)) {
      setErrorMsg("Enter an amount to stake");
      return;
    }
    try {
      const tx = await stake(amount);
      setStakeTx(tx as string);
      setApproveStep(false);
      setTimeout(() => { refetchBalance(); refetchStake(); }, 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Staking failed");
    }
  };

  const handleUnstake = async () => {
    setErrorMsg(null);
    try {
      unstake();
      setUnstakeTx("pending");
      setTimeout(() => { refetchBalance(); refetchStake(); }, 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unstake failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="terminal p-12 text-center">
              <span className="text-[10px] uppercase text-[#444444] font-mono">WALLET_REQUIRED</span>
              <h1 className="text-2xl font-mono text-white mt-4 mb-4">CONNECT_WALLET</h1>
              <p className="text-[#666666] font-mono text-sm">Connect your wallet to access the JRX faucet and judge staking.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <span className="text-white">FAUCET</span>
          </nav>

          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">JRX_TOKEN</span>
            <h1 className="text-3xl md:text-4xl font-mono text-white mt-2 mb-4">FAUCET_&_STAKING</h1>
            <p className="text-[#666666] font-mono text-sm">
              Get JRX tokens and stake to become a judge in the Jurex Network.
            </p>
          </div>

          {/* Token info */}
          <div className="terminal mb-4">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">jrx_token.info</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#444444]">CONTRACT</span>
                <Link
                  href={`https://sepolia.arbiscan.io/address/${JRX_TOKEN.address}`}
                  target="_blank"
                  className="text-[#00ff41] hover:underline"
                >
                  {JRX_TOKEN.address.slice(0, 12)}...{JRX_TOKEN.address.slice(-6)} ↗
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-[#444444]">YOUR_BALANCE</span>
                <span className="text-white">{jrxBalanceFormatted} JRX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#444444]">STAKED_AS_JUDGE</span>
                <span className={isEligibleJudge ? "text-[#00ff41]" : "text-[#ffcc00]"}>
                  {judgeStakeFormatted} JRX {isEligibleJudge ? "(ELIGIBLE)" : "(NEED 1,000+)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#444444]">JUDGE_POOL_SIZE</span>
                <span className="text-white">{judgePoolSize?.toString() || "0"} judges</span>
              </div>
            </div>
          </div>

          {/* Drip Section */}
          <div className="terminal mb-4">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">faucet.drip</span>
              <span className="ml-auto text-[10px] text-[#444444] font-mono">10,000 JRX/day</span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#666666] font-mono text-xs">
                Drip 10,000 JRX to your wallet once per 24 hours. No ETH required.
              </p>

              {dripTx && (
                <div className="p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                  <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">DRIP_SUCCESSFUL</p>
                  <Link
                    href={`https://sepolia.arbiscan.io/tx/${dripTx}`}
                    target="_blank"
                    className="text-xs font-mono text-[#888888] hover:text-[#00ff41] break-all"
                  >
                    {dripTx.slice(0, 20)}... ↗
                  </Link>
                </div>
              )}

              {!canDrip && cooldownRemaining > 0 && (
                <div className="p-3 border border-[#ffcc00]/30 bg-[#ffcc00]/5">
                  <p className="text-[10px] text-[#ffcc00] font-mono">
                    COOLDOWN: {Math.floor(cooldownRemaining / 3600)}h {Math.floor((cooldownRemaining % 3600) / 60)}m remaining
                  </p>
                </div>
              )}

              <button
                onClick={handleDrip}
                disabled={isDripping || !canDrip}
                className="w-full px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDripping ? "DRIPPING..." : canDrip ? "DRIP_10000_JRX →" : "COOLDOWN_ACTIVE"}
              </button>
            </div>
          </div>

          {/* Judge Staking Section */}
          <div className="terminal mb-4">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">judge_staking.stake</span>
              <span className="ml-auto text-[10px] text-[#444444] font-mono">MIN: 1,000 JRX</span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#666666] font-mono text-xs">
                Stake at least 1,000 JRX to enter the judge pool. Judges earn fees and can be slashed for dishonest votes.
              </p>

              <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#444444]">MIN_STAKE</span>
                  <span className="text-white">1,000 JRX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#444444]">SLASH_AMOUNT</span>
                  <span className="text-[#ff3366]">100 JRX per dishonest vote</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#444444]">CURRENT_STAKE</span>
                  <span className={isEligibleJudge ? "text-[#00ff41]" : "text-white"}>{judgeStakeFormatted} JRX</span>
                </div>
              </div>

              {stakeTx && (
                <div className="p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                  <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">STAKE_CONFIRMED — JUDGE_POOL_JOINED</p>
                  <Link
                    href={`https://sepolia.arbiscan.io/tx/${stakeTx}`}
                    target="_blank"
                    className="text-xs font-mono text-[#888888] hover:text-[#00ff41] break-all"
                  >
                    {stakeTx.slice(0, 20)}... ↗
                  </Link>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  min="1000"
                  placeholder="1000"
                  className="flex-1 bg-[#050505] border border-[#1a1a1a] px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41] transition-colors"
                />
                <span className="flex items-center text-[#444444] font-mono text-sm px-2">JRX</span>
              </div>

              {/* Two-step: Approve then Stake */}
              {!approveStep ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full px-4 py-3 border border-[#ffcc00] text-[#ffcc00] font-mono text-sm hover:bg-[#ffcc00]/10 transition-colors disabled:opacity-50"
                >
                  {isApproving ? "APPROVING..." : `STEP_1: APPROVE_${stakeInput || "0"}_JRX →`}
                </button>
              ) : (
                <button
                  onClick={handleStake}
                  disabled={isStaking}
                  className="w-full px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50"
                >
                  {isStaking ? "STAKING..." : `STEP_2: STAKE_${stakeInput || "0"}_JRX_AS_JUDGE →`}
                </button>
              )}

              {/* Unstake */}
              {Number(judgeStakeFormatted) > 0 && (
                <div className="pt-2 border-t border-[#1a1a1a]">
                  {unstakeTx && (
                    <p className="text-[10px] text-[#00ff41] font-mono mb-2">UNSTAKE_SUBMITTED — tokens returning...</p>
                  )}
                  <button
                    onClick={handleUnstake}
                    disabled={isUnstaking}
                    className="w-full px-4 py-3 border border-[#ff3366] text-[#ff3366] font-mono text-sm hover:bg-[#ff3366]/10 transition-colors disabled:opacity-50"
                  >
                    {isUnstaking ? "UNSTAKING..." : `UNSTAKE_ALL_${judgeStakeFormatted}_JRX`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="border border-[#ff3366]/30 bg-[#ff3366]/10 p-4 mb-4">
              <p className="text-[#ff3366] font-mono text-sm break-all">ERROR: {errorMsg}</p>
            </div>
          )}

          {/* Info footer */}
          <div className="terminal p-4">
            <div className="font-mono text-xs space-y-1 text-[#444444]">
              <p><span className="text-[#00ff41]">&gt;</span> JRX is the Jurex Network governance and judge-staking token</p>
              <p><span className="text-[#00ff41]">&gt;</span> Stake 1,000+ JRX to become eligible as a case judge</p>
              <p><span className="text-[#00ff41]">&gt;</span> Judges who vote with the majority earn court fees</p>
              <p><span className="text-[#00ff41]">&gt;</span> Minority voters are slashed 100 JRX per case</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
