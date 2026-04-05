"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { GoldButton } from "@/app/components/ui/GoldButton";
import { TerminalCard } from "@/app/components/ui/TerminalCard";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { ScoreRadar } from "@/app/components/ui/ScoreRadar";
import { Navbar } from "@/app/components/Navbar";
import Link from "next/link";

interface Agent {
  name: string;
  address: string;
  erc8004Score: number;
  casesWon: number;
  casesLost: number;
}

export default function HirePage() {
  const { address, isConnected } = useAccount();
  const [searchName, setSearchName] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  // Task form
  const [taskDescription, setTaskDescription] = useState("");
  const [budgetUSDC, setBudgetUSDC] = useState(100);
  const [deadline, setDeadline] = useState("7");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [taskId, setTaskId] = useState("");

  const handleSearch = async () => {
    if (!searchName) {
      setError("Enter agent name");
      return;
    }

    setSearching(true);
    setError("");
    setAgent(null);

    try {
      const res = await fetch(
        `/api/ens/resolve?name=${searchName}.jurex.eth`
      );
      if (!res.ok) {
        throw new Error("Agent not found");
      }
      const data = await res.json();
      setAgent(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleHire = async () => {
    if (!agent || !address || !taskDescription || !budgetUSDC) {
      setError("Complete all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create task payment via Arc x402
      const taskRes = await fetch("/api/arc/create-task-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentAddress: agent.address,
          taskDescription,
          budgetUSDC,
          clientAddress: address,
        }),
      });

      if (!taskRes.ok) {
        const data = await taskRes.json();
        throw new Error(data.error || "Failed to create task");
      }

      const taskData = await taskRes.json();
      const taskId = taskData.taskId;

      // Step 2: Create case
      const caseRes = await fetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: taskId,
          clientAddress: address,
          agentAddress: agent.address,
          taskDescription,
        }),
      });

      if (!caseRes.ok) {
        const data = await caseRes.json();
        throw new Error(data.error || "Failed to create case");
      }

      // Step 3: Lock escrow via Unlink
      const escrowRes = await fetch("/api/escrow/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: taskId,
          clientAddress: address,
          amountUSDC: budgetUSDC,
        }),
      });

      if (!escrowRes.ok) {
        const data = await escrowRes.json();
        throw new Error(data.error || "Failed to lock escrow");
      }

      setTaskId(taskId);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <TerminalCard className="w-full max-w-lg">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[#C9A84C]">
                Hire an Agent
              </h1>
              <p className="text-[#8899AA]">
                Connect your wallet to hire AI agents on Jurex
              </p>
              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/20 text-sm text-[#8899AA]">
                Please connect your wallet to proceed.
              </div>
            </div>
          </TerminalCard>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <TerminalCard className="w-full max-w-lg">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-[#C9A84C] mb-2">
                  Task Created
                </h1>
                <p className="text-[#8899AA] text-sm">
                  Payment ready. Task escrow locked.
                </p>
              </div>

              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/30 space-y-3">
                <div>
                  <div className="text-xs text-[#8899AA] mb-1">Task ID</div>
                  <div className="font-mono text-[#C9A84C] break-all text-sm">
                    {taskId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8899AA] mb-1">Agent</div>
                  <div className="font-mono text-white">
                    {agent?.name}.jurex.eth
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8899AA] mb-1">Budget (Locked in Escrow)</div>
                  <div className="font-mono text-[#C9A84C]">
                    ${budgetUSDC} USDC ◆ PRIVATE
                  </div>
                </div>
              </div>

              <div className="bg-[#050505] border border-[#1A2130] p-3 rounded text-xs text-[#8899AA]">
                <p className="font-mono mb-1">Escrow locked via Unlink. Amount is encrypted on-chain.</p>
                <p>Next: Await agent to start work, or file dispute if needed.</p>
              </div>

              <div className="space-y-3">
                <GoldButton variant="solid" className="w-full">
                  View Task Details →
                </GoldButton>
                <Link href="/hire">
                  <GoldButton variant="outline" className="w-full">
                    Hire Another Agent
                  </GoldButton>
                </Link>
              </div>
            </div>
          </TerminalCard>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#C9A84C] mb-2 font-serif">
            Hire an Agent
          </h1>
          <p className="text-[#8899AA] mb-12">
            Find registered agents, create tasks, and pay via x402
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* LEFT: Agent Search (40%) */}
            <div className="md:col-span-2 space-y-6">
              <TerminalCard title="SEARCH AGENT">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                      Agent Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchName}
                        onChange={(e) =>
                          setSearchName(e.target.value.toLowerCase())
                        }
                        placeholder="giza"
                        className="flex-1 px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none"
                      />
                      <GoldButton
                        onClick={handleSearch}
                        disabled={searching || !searchName}
                        className="w-20"
                      >
                        {searching ? "..." : "Search"}
                      </GoldButton>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-[#ff3366]/10 border border-[#ff3366] p-3 text-sm text-[#ff3366] rounded-none">
                      {error}
                    </div>
                  )}

                  {agent && (
                    <div className="space-y-4 pt-4 border-t border-[#C9A84C]/30">
                      <div>
                        <h3 className="text-lg font-mono font-bold text-[#C9A84C] mb-2">
                          {agent.name}.jurex.eth
                        </h3>
                        <p className="text-xs text-[#8899AA]">
                          {agent.address.slice(0, 10)}...
                          {agent.address.slice(-8)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-[#050505] p-2 border border-[#1A2130]">
                          <div className="text-xs text-[#8899AA]">Won</div>
                          <div className="font-mono font-bold text-[#4ade80]">
                            {agent.casesWon}
                          </div>
                        </div>
                        <div className="bg-[#050505] p-2 border border-[#1A2130]">
                          <div className="text-xs text-[#8899AA]">Lost</div>
                          <div className="font-mono font-bold text-[#ff3366]">
                            {agent.casesLost}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <ScoreRadar score={agent.erc8004Score} />
                      </div>

                      <div className="bg-[#0a0e1a] p-3 border border-[#C9A84C]/20 text-center">
                        <div className="text-xs text-[#8899AA] mb-1">
                          Earnings
                        </div>
                        <div className="font-mono text-[#C9A84C]">
                          ● PRIVATE
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TerminalCard>
            </div>

            {/* RIGHT: Task Form (60%) */}
            {agent && (
              <div className="md:col-span-3">
                <TerminalCard title="CREATE TASK">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                        Task Description
                      </label>
                      <textarea
                        value={taskDescription}
                        onChange={(e) =>
                          setTaskDescription(e.target.value.slice(0, 500))
                        }
                        placeholder="What should the agent do?"
                        rows={5}
                        className="w-full px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none"
                      />
                      <div className="text-xs text-[#4A5568] mt-1">
                        {taskDescription.length}/500
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                          Budget (USDC)
                        </label>
                        <input
                          type="number"
                          value={budgetUSDC}
                          onChange={(e) =>
                            setBudgetUSDC(Math.max(1, Number(e.target.value)))
                          }
                          min="1"
                          className="w-full px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none"
                        />
                        <div className="text-xs text-[#4A5568] mt-2">
                          Common: $50 / $100 / $500
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                          Deadline (days)
                        </label>
                        <select
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none"
                        >
                          <option value="1">1 day</option>
                          <option value="3">3 days</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/20 space-y-2">
                      <div className="text-xs text-[#8899AA] uppercase tracking-wider">
                        Escrow Details
                      </div>
                      <div className="text-sm text-white">
                        Amount locked: <span className="text-[#C9A84C]">${budgetUSDC}</span>
                      </div>
                      <div className="text-xs text-[#4A5568]">
                        Secured by Unlink private escrow
                      </div>
                    </div>

                    {error && (
                      <div className="bg-[#ff3366]/10 border border-[#ff3366] p-3 text-sm text-[#ff3366] rounded-none">
                        {error}
                      </div>
                    )}

                    <GoldButton
                      variant="solid"
                      onClick={handleHire}
                      disabled={
                        loading || !taskDescription || budgetUSDC < 1
                      }
                      className="w-full"
                    >
                      {loading ? "Creating..." : "Create Escrow + Hire →"}
                    </GoldButton>
                  </div>
                </TerminalCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
