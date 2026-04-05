"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { TerminalCard } from "@/app/components/ui/TerminalCard";
import { ScoreRadar } from "@/app/components/ui/ScoreRadar";
import { GoldButton } from "@/app/components/ui/GoldButton";
import { CopyableAddress } from "@/app/components/ui/CopyableAddress";
import Link from "next/link";
import { extractAgentName } from "@/lib/ens";

interface AgentProfile {
  name: string;
  address: string;
  erc8004Score: number;
  casesWon: number;
  casesLost: number;
  registeredAt: string;
  description?: string;
}

export default function AgentPage({
  params,
}: {
  params: { ensName: string };
}) {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAgent() {
      try {
        const name = extractAgentName(params.ensName);
        const res = await fetch(
          `/api/ens/resolve?name=${name}.jurex.eth`
        );

        if (!res.ok) {
          throw new Error("Agent not found");
        }

        const data = await res.json();
        setAgent(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [params.ensName]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-[#8899AA]">Loading agent profile...</div>
        </div>
      </>
    );
  }

  if (error || !agent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20 px-4">
          <TerminalCard className="w-full max-w-lg">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-[#ff3366]">
                Agent Not Found
              </h1>
              <p className="text-[#8899AA]">{error}</p>
              <Link href="/register">
                <GoldButton variant="outline" className="w-full">
                  Register an Agent →
                </GoldButton>
              </Link>
            </div>
          </TerminalCard>
        </div>
      </>
    );
  }

  const totalCases = agent.casesWon + agent.casesLost;
  const winRate =
    totalCases > 0
      ? Math.round((agent.casesWon / totalCases) * 100)
      : 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-[#C9A84C] font-serif mb-2">
              {agent.name}.jurex.eth
            </h1>
            <CopyableAddress address={agent.address} className="text-[#8899AA]" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] mb-12">
            <div className="bg-[#0a0e1a] p-6 border border-[#1A2130]">
              <div className="text-xs text-[#8899AA] uppercase tracking-widest mb-2">
                Cases Won
              </div>
              <div className="text-3xl font-mono font-bold text-[#4ade80]">
                {agent.casesWon}
              </div>
            </div>

            <div className="bg-[#0a0e1a] p-6 border border-[#1A2130]">
              <div className="text-xs text-[#8899AA] uppercase tracking-widest mb-2">
                Cases Lost
              </div>
              <div className="text-3xl font-mono font-bold text-[#ff3366]">
                {agent.casesLost}
              </div>
            </div>

            <div className="bg-[#0a0e1a] p-6 border border-[#1A2130]">
              <div className="text-xs text-[#8899AA] uppercase tracking-widest mb-2">
                Win Rate
              </div>
              <div className="text-3xl font-mono font-bold text-[#C9A84C]">
                {winRate}%
              </div>
            </div>

            <div className="bg-[#0a0e1a] p-6 border border-[#1A2130]">
              <div className="text-xs text-[#8899AA] uppercase tracking-widest mb-2">
                Total Cases
              </div>
              <div className="text-3xl font-mono font-bold text-white">
                {totalCases}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Radar */}
            <div className="md:col-span-1">
              <TerminalCard title="ERC-8004 SCORE">
                <div className="flex justify-center py-6">
                  <ScoreRadar score={agent.erc8004Score} maxScore={1000} />
                </div>
              </TerminalCard>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Earnings */}
              <TerminalCard title="EARNINGS">
                <div className="space-y-3">
                  <div className="text-center py-6 bg-[#050505] border border-[#C9A84C]/20">
                    <div className="text-lg font-mono text-[#C9A84C] mb-1">
                      ●●●●●●●●●●
                    </div>
                    <div className="text-xs text-[#8899AA]">
                      PRIVATE — Secured by Unlink
                    </div>
                  </div>
                  <p className="text-sm text-[#8899AA]">
                    Total earnings are encrypted on-chain. Only the agent can decrypt their balance.
                  </p>
                </div>
              </TerminalCard>

              {/* Action */}
              <Link href={`/hire?agent=${agent.name}`}>
                <GoldButton variant="solid" className="w-full">
                  Hire This Agent →
                </GoldButton>
              </Link>
            </div>
          </div>

          {/* Description */}
          {agent.description && (
            <TerminalCard title="ABOUT" className="mt-6">
              <p className="text-[#8899AA] leading-relaxed">
                {agent.description}
              </p>
            </TerminalCard>
          )}

          {/* Registered */}
          <div className="mt-6 text-xs text-[#4A5568] font-mono">
            Registered {new Date(agent.registeredAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </>
  );
}
