"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useRegisteredAgentsCount, useAgentProfile, useSelfRegister } from "@/lib/contract-hooks";
import { CONTRACTS } from "@/lib/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-service-sand.vercel.app";

// Mock agents as fallback
const mockAgents = [
  { id: "AGENT-001", name: "TradeBot_Alpha", address: "0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe", reputation: 98, status: "active", category: "TRADING", riskScore: 15, trustTier: "verified" },
  { id: "AGENT-002", name: "Data_Oracle_X", address: "0x3266C91c378808966dA4787866eB47D59CA3CAb5", reputation: 94, status: "active", category: "ORACLE", riskScore: 8, trustTier: "verified" },
];

const trustTierConfig: Record<string, { color: string; bg: string; border: string }> = {
  verified: { color: "text-[#00ff41]", bg: "bg-[#00ff41]/10", border: "border-[#00ff41]/50" },
  standard: { color: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", border: "border-[#ffcc00]/50" },
  probation: { color: "text-[#ff3366]", bg: "bg-[#ff3366]/10", border: "border-[#ff3366]/50" },
  banned: { color: "text-[#666666]", bg: "bg-[#333333]", border: "border-[#444444]" },
};

interface AgentData {
  id: string;
  name: string;
  address: string;
  reputation: number;
  status: string;
  category: string;
  riskScore: number;
  trustTier: string;
}

export default function RegistryPage() {
  const { address, isConnected } = useAccount();
  const { data: registeredCount, refetch: refetchCount } = useRegisteredAgentsCount();
  const { data: agentProfile, refetch: refetchProfile } = useAgentProfile(address);
  const { selfRegister, isPending: isRegistering } = useSelfRegister();

  const [agents, setAgents] = useState<AgentData[]>(mockAgents);
  const [isLoading, setIsLoading] = useState(true);
  const [apiNote, setApiNote] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const isRegistered = !!(agentProfile as any)?.isRegistered;

  const handleSelfRegister = async () => {
    try {
      await selfRegister(address as string);
      setRegisterSuccess(true);
      refetchProfile();
      refetchCount();
      // Re-fetch agents list
      try {
        const response = await fetch(`${API_BASE_URL}/agent/discover`);
        if (response.ok) {
          const data = await response.json();
          if (data.agents && data.agents.length > 0) {
            setAgents(data.agents);
          }
        }
      } catch {}
    } catch (err) {
      console.error("Self-registration failed:", err);
    }
  };

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/agent/discover`);
        if (response.ok) {
          const data = await response.json();
          if (data.note) {
            setApiNote(data.note);
          }
          if (data.agents && data.agents.length > 0) {
            setAgents(data.agents);
          }
        }
      } catch (err) {
        console.error("Failed to fetch agents:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Calculate derived stats
  const onProbation = agents.filter(a => a.trustTier === "probation").length;
  const banned = agents.filter(a => a.trustTier === "banned").length;
  const verified = agents.filter(a => a.trustTier === "verified").length;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <span className="text-white">REGISTRY</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">AGENT_DIRECTORY</span>
            <h1 className="text-3xl md:text-4xl font-mono text-white mt-2 mb-4">REGISTRY</h1>
            <p className="text-[#666666] font-mono text-sm max-w-xl">
              Verified agents in the network. Risk scores calculated from case history.
            </p>
          </div>

          {/* Contract Info */}
          <div className="terminal mb-6">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">CONTRACT_INFO.sys</span>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#444444]">NETWORK</span>
                <span className="text-[#00ff41]">ARBITRUM_SEPOLIA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#444444]">REGISTRY_CONTRACT</span>
                <Link 
                  href={`https://sepolia.arbiscan.io/address/${CONTRACTS.CourtRegistry.address}`}
                  target="_blank"
                  className="text-[#888888] hover:text-[#00ff41]"
                >
                  {CONTRACTS.CourtRegistry.address.slice(0, 12)}...{CONTRACTS.CourtRegistry.address.slice(-6)}
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#444444]">FACTORY_CONTRACT</span>
                <Link 
                  href={`https://sepolia.arbiscan.io/address/${CONTRACTS.CourtCaseFactory.address}`}
                  target="_blank"
                  className="text-[#888888] hover:text-[#00ff41]"
                >
                  {CONTRACTS.CourtCaseFactory.address.slice(0, 12)}...{CONTRACTS.CourtCaseFactory.address.slice(-6)}
                </Link>
              </div>
            </div>          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] mb-8">
            <StatBox label="REGISTERED" value={registeredCount?.toString() || agents.length.toString()} />
            <StatBox label="VERIFIED" value={verified.toString()} color="[#00ff41]" />
            <StatBox label="ON_PROBATION" value={onProbation.toString()} color="[#ffcc00]" />
            <StatBox label="BANNED" value={banned.toString()} color="[#ff3366]" />
          </div>

          {/* API Notice */}
          {apiNote && (
            <div className="border border-[#ffcc00]/30 bg-[#ffcc00]/5 p-4 mb-6">
              <p className="text-[#ffcc00] font-mono text-sm">⚠ {apiNote}</p>
            </div>
          )}

          {/* Self-Registration */}
          {isConnected && !isRegistered && (
            <div className="terminal mb-6">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-white text-sm mb-1">NOT_REGISTERED</p>
                  <p className="font-mono text-[#444444] text-xs">Register your wallet as an agent to participate in the court system.</p>
                </div>
                <button
                  onClick={handleSelfRegister}
                  disabled={isRegistering}
                  className="px-6 py-3 bg-[#00ff41] text-black font-mono text-sm hover:bg-[#00cc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? "REGISTERING..." : "REGISTER_AGENT"}
                </button>
              </div>
            </div>
          )}

          {/* Registration Success */}
          {registerSuccess && (
            <div className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-4 mb-6">
              <p className="text-[#00ff41] font-mono text-sm">Agent registered successfully. Your reputation starts at 100.</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="terminal p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-[#00ff41] animate-pulse" />
                <span className="font-mono text-[#444444]">LOADING_AGENT_REGISTRY...</span>
              </div>            </div>
          ) : (
            <div className="space-y-2">
              {agents.length === 0 ? (
                <div className="text-center py-16 border border-[#1a1a1a]">
                  <p className="text-[#444444] font-mono">NO_AGENTS_FOUND</p>
                </div>
              ) : (
                agents.map((agent) => {
                  const tier = trustTierConfig[agent.trustTier] || trustTierConfig.standard;
                  const riskColor = agent.riskScore > 40 ? "[#ff3366]" : agent.riskScore > 20 ? "[#ffcc00]" : "[#00ff41]";
                  
                  return (
                    <Link
                      key={agent.id}
                      href={`/agents/${agent.address}`}
                      className="block data-card group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                          <span className="text-[#333333] font-mono text-xl">{agent.name?.[0] || "?"}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-white group-hover:text-[#00ff41] transition-colors">{agent.name || "UNKNOWN"}</span>
                            <span className={`text-[10px] px-2 py-0.5 border ${tier.border} ${tier.color} ${tier.bg}`}>
                              {(agent.trustTier || "STANDARD").toUpperCase()}
                            </span>
                            <span className="text-[10px] text-[#444444] font-mono px-2 py-0.5 border border-[#1a1a1a]">{agent.category || "UNKNOWN"}</span>
                          </div>
                          <Link 
                            href={`https://sepolia.arbiscan.io/address/${agent.address}`}
                            target="_blank"
                            className="font-mono text-xs text-[#444444] hover:text-[#00ff41]"
                          >
                            {agent.address}
                          </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 md:gap-8">
                          <div className="text-right">
                            <span className="text-[10px] text-[#444444] font-mono block">REPUTATION</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-[#1a1a1a]">
                                <div className="h-full bg-[#00ff41]" style={{ width: `${agent.reputation || 0}%` }} />
                              </div>
                              <span className="font-mono text-white">{agent.reputation || 0}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#444444] font-mono block">RISK</span>
                            <span className={`font-mono text-${riskColor}`}>{agent.riskScore || 0}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 ${agent.status === 'active' ? 'bg-[#00ff41]' : 'bg-[#444444]'}`} />
                            <span className="text-[10px] text-[#444444] font-mono">{(agent.status || "UNKNOWN").toUpperCase()}</span>
                          </div>

                          <span className="text-[#1a1a1a] font-mono text-xl group-hover:text-[#00ff41] transition-colors">→</span>
                        </div>                      </div>                    </Link>
                  );
                })
              )}
            </div>          )}
        </div>      </main>
      
      <Footer />
    </div>
  );
}

function StatBox({ label, value, color = "white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-4">
      <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">{label}</p>
      <p className={`text-2xl font-mono text-${color}`}>{value}</p>
    </div>
  );
}
