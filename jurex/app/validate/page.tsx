"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useSubmitVote } from "@/lib/contract-hooks";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-service-sand.vercel.app";

// Terminal typing animation hook
function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayText, isComplete };
}

// Blinking cursor component
function Cursor({ blink = true }: { blink?: boolean }) {
  return (
    <span className={`inline-block w-2 h-4 bg-[#00ff41] ml-1 ${blink ? 'animate-pulse' : ''}`} />
  );
}

interface PendingCase {
  id: string;
  address: string;
  category: string;
  stake: string;
  evidenceCount: number;
  timeRemaining: string;
  plaintiff: string;
  defendant: string;
}

export default function ValidatorDashboardPage() {
  const { address, isConnected } = useAccount();
  const { vote, isPending: isVoting } = useSubmitVote();
  const [isValidator, setIsValidator] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [pendingValidations, setPendingValidations] = useState<PendingCase[]>([]);
  const [validatorStats, setValidatorStats] = useState({ totalValidated: 0, accuracy: 0, rewards: "0 JRX", rank: "NOVICE", staked: "0 JRX" });

  // Typewriter texts for the hero
  const line1 = useTypewriter("BECOME_A_VALIDATOR", 60, 300);
  const line2 = useTypewriter("validate_disputes._earn_rewards.", 40, 800);
  const line3 = useTypewriter("maintain_justice_in_the_network.", 40, 1800);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch pending cases from API when validator dashboard is active
  useEffect(() => {
    if (!isValidator) return;
    async function fetchPending() {
      try {
        const res = await fetch(`${API_BASE_URL}/cases`);
        if (res.ok) {
          const data = await res.json();
          const cases: PendingCase[] = (data.cases || []).slice(0, 10).map((addr: string) => ({
            id: addr.slice(0, 8) + "..." + addr.slice(-6),
            address: addr,
            category: "DISPUTE",
            stake: "—",
            evidenceCount: 0,
            timeRemaining: "—",
            plaintiff: "...",
            defendant: "...",
          }));
          if (cases.length > 0) setPendingValidations(cases);
        }
      } catch {
        // API unavailable — leave empty
      }
    }
    async function fetchStats() {
      if (!address) return;
      try {
        const res = await fetch(`${API_BASE_URL}/validate/stats/${address}`);
        if (res.ok) {
          const data = await res.json();
          setValidatorStats(data);
        }
      } catch {
        // API unavailable — leave defaults
      }
    }
    fetchPending();
    fetchStats();
  }, [isValidator, address]);

  if (!isValidator) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        
        <main className="pt-20 md:pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6 md:mb-8">
              <Link href="/" className="hover:text-[#00ff41] transition-colors">HOME</Link>
              <span>/</span>
              <span className="text-white">VALIDATE</span>
            </nav>

            {/* Terminal Header */}
            <div className="terminal mb-6 md:mb-8">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="ml-4 text-xs text-[#444444] font-mono">validator_onboarding.exe</span>
              </div>
              
              <div className="p-6 md:p-12 text-center">
                {/* ASCII Art - Responsive sizing */}
                <pre className="text-[6px] sm:text-[8px] md:text-xs text-[#333333] font-mono mb-6 md:mb-8 leading-none hidden sm:block">{`
   _    _   _                          _ _           _   _
  /_\\  | | | |_ ___ _ __ _ __ ___   __| | |__  _   _| |_| |
 //_\\\\ | | | __/ _ \\ '__| '_ ' _ \\ / _' | '_ \\| | | | __| |
/  _  \\| | | ||  __/ |  | | | | | | (_| | | | | |_| | |_|_|
\\_/ \\_/_|  \\__\\___|_|  |_| |_| |_|\\__,_|_| |_|\\__,_|\\__(_)
`}</pre>

                {/* Mobile Title */}
                <div className="sm:hidden mb-6">
                  <span className="text-xs text-[#00ff41] font-mono">[VALIDATOR_NODE]</span>
                </div>

                {/* Typewriter Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-mono text-white mb-4 md:mb-6 min-h-[1.2em]">
                  {line1.displayText}
                  {!line1.isComplete && <Cursor />}
                </h1>
                
                {/* Typewriter Subtitles */}
                <div className="text-left max-w-md mx-auto mb-6 md:mb-8 space-y-2">
                  <p className="text-sm md:text-base text-[#888888] font-mono min-h-[1.2em]">
                    <span className="text-[#00ff41]">$</span> {line2.displayText}
                    {line1.isComplete && !line2.isComplete && <Cursor />}
                  </p>
                  <p className="text-sm md:text-base text-[#888888] font-mono min-h-[1.2em]">
                    <span className="text-[#00ff41]">$</span> {line3.displayText}
                    {line2.isComplete && !line3.isComplete && <Cursor />}
                  </p>
                </div>

                {/* Requirements Terminal */}
                <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 md:p-6 mb-6 md:mb-8 text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1a1a1a]">
                    <span className="text-[#ff3366]">●</span>
                    <span className="text-xs text-[#444444] font-mono">REQUIREMENTS.sys</span>
                  </div>
                  
                  <ul className="space-y-3 text-sm font-mono">
                    {[
                      { icon: "▸", text: "Stake minimum 1,000 JRX tokens (free from faucet)", color: "[#ffcc00]" },
                      { icon: "▸", text: "Maintain 95%+ accuracy rate", color: "[#00ff41]" },
                      { icon: "▸", text: "Respond within 24 hours", color: "[#00ff41]" },
                      { icon: "▸", text: "Wallet connection required", color: "[#ffcc00]" },
                    ].map((req, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 text-[#888888] group hover:text-white transition-colors"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className={`text-${req.color} mt-0.5 group-hover:animate-pulse`}>{req.icon}</span>
                        <span>{req.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => isConnected && setIsValidator(true)}
                  disabled={isAnimating || !isConnected}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41] hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="group-hover:animate-pulse">
                      {isConnected ? "[STAKE_JRX_→_JUDGE_POOL]" : "[CONNECT_WALLET_FIRST]"}
                    </span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </button>

                <p className="text-xs text-[#444444] font-mono mt-4">
                  {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)} — Stake JRX at /faucet` : "Connect wallet to become a validator"}
                </p>
              </div>
            </div>

            {/* Info Cards - Mobile Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {[
                { label: "ACTIVE_VALIDATORS", value: "—", suffix: "nodes" },
                { label: "TOTAL_STAKED", value: "—", suffix: "JRX" },
                { label: "AVG_REWARD", value: "—", suffix: "JRX/case" },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 text-center hover:border-[#333333] transition-colors"
                >
                  <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-mono text-white">{stat.value}</p>
                  <p className="text-[10px] text-[#444444] font-mono">{stat.suffix}</p>
                </div>
              ))}
            </div>          </div>        </main>
        
        <Footer />
      </div>
    );
  }

  // Validator Dashboard View
  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-4 md:mb-6">
            <Link href="/" className="hover:text-[#00ff41] transition-colors">HOME</Link>
            <span>/</span>
            <Link href="/validate" className="hover:text-[#00ff41] transition-colors">VALIDATE</Link>
            <span>/</span>
            <span className="text-white">DASHBOARD</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">VALIDATOR_DASHBOARD</span>
                <span className="flex items-center gap-1.5 text-[10px] text-[#00ff41]">
                  <span className="w-1.5 h-1.5 bg-[#00ff41] animate-pulse rounded-full" />
                  ONLINE
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-mono text-white">REVIEW_CASES</h1>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 border border-[#00ff41]/30 bg-[#00ff41]/5">
              <span className="text-xs text-[#00ff41] font-mono">RANK: {validatorStats.rank}</span>
            </div>
          </div>

          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a1a1a] mb-6 md:mb-8">
            <StatBox label="VALIDATED" value={validatorStats.totalValidated} />
            <StatBox label="ACCURACY" value={`${validatorStats.accuracy}%`} color="[#00ff41]" />
            <StatBox label="EARNED" value={validatorStats.rewards} color="[#00ff41]" />
            <StatBox label="RANK" value={validatorStats.rank} />
            <StatBox label="STAKED" value={validatorStats.staked} />
          </div>

          {/* Pending Validations */}
          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">PENDING_VALIDATIONS.exe</span>
              <span className="ml-auto text-xs text-[#444444] font-mono">{pendingValidations.length} CASES</span>
            </div>

            <div className="divide-y divide-[#1a1a1a]">
              {pendingValidations.map((caseItem) => {
                const isUrgent = caseItem.timeRemaining.includes("6h");
                return (
                  <div 
                    key={caseItem.id} 
                    className="p-4 md:p-6 hover:bg-[#0a0a0a] transition-colors group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                          <span className="font-mono text-white text-sm md:text-base group-hover:text-[#00ff41] transition-colors">
                            {caseItem.id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 border border-[#333333] text-[#888888] font-mono">
                            {caseItem.category}
                          </span>
                          {isUrgent && (
                            <span className="text-[10px] px-2 py-0.5 bg-[#ff3366]/20 text-[#ff3366] border border-[#ff3366]/50 font-mono animate-pulse">
                              URGENT
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:text-sm text-[#666666] font-mono">
                          <span>{caseItem.plaintiff}</span>
                          <span className="text-[#333333]">VS</span>
                          <span>{caseItem.defendant}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        <div className="text-right">
                          <p className="text-[10px] text-[#444444] font-mono">STAKE</p>
                          <p className="font-mono text-white">{caseItem.stake}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-[#444444] font-mono">EVIDENCE</p>
                          <p className="font-mono text-white">{caseItem.evidenceCount} files</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-[#444444] font-mono">TIME_LEFT</p>
                          <p className={`font-mono ${isUrgent ? 'text-[#ff3366]' : 'text-[#888888]'}`}>
                            {caseItem.timeRemaining}
                          </p>
                        </div>

                        {/* Vote Buttons - Stack on mobile */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          <button
                            onClick={() => vote(caseItem.address, true)}
                            disabled={isVoting || !caseItem.address.startsWith("0x")}
                            className="flex-1 lg:flex-none px-3 md:px-4 py-2 border border-[#1a1a1a] text-[#666666] font-mono text-xs hover:border-[#00ff41] hover:text-[#00ff41] transition-colors disabled:opacity-40"
                          >
                            PLAINTIFF
                          </button>
                          <button
                            onClick={() => vote(caseItem.address, false)}
                            disabled={isVoting || !caseItem.address.startsWith("0x")}
                            className="flex-1 lg:flex-none px-3 md:px-4 py-2 border border-[#1a1a1a] text-[#666666] font-mono text-xs hover:border-[#ff3366] hover:text-[#ff3366] transition-colors disabled:opacity-40"
                          >
                            DEFENDANT
                          </button>
                        </div>
                      </div>
                    </div>                  </div>
                );
              })}
            </div>          </div>

          {/* Recent Activity - Mobile friendly */}
          <div className="mt-6 md:mt-8 border border-[#1a1a1a] bg-[#0a0a0a] p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase text-[#444444] font-mono">RECENT_ACTIVITY</span>
              <span className="text-[10px] text-[#444444] font-mono">LAST_24H</span>
            </div>
            
            <div className="space-y-3">
              {[
                { action: "VALIDATED", caseId: "CASE-8842", outcome: "PLAINTIFF_WINS", reward: "+50 JRX", time: "2h ago" },
                { action: "REWARD_CLAIMED", amount: "120 JRX", time: "5h ago" },
                { action: "VALIDATED", caseId: "CASE-8841", outcome: "DEFENDANT_WINS", reward: "+50 JRX", time: "8h ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-xs md:text-sm py-2 border-b border-[#1a1a1a] last:border-0">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-[#00ff41]">▸</span>
                    <span className="text-[#888888] font-mono">{activity.action}</span>
                    {activity.caseId && <span className="text-white font-mono">{activity.caseId}</span>}
                    {activity.outcome && <span className="text-[#444444]">→</span>}
                    {activity.outcome && <span className="text-white font-mono">{activity.outcome}</span>}
                    {activity.amount && <span className="text-[#00ff41] font-mono">{activity.amount}</span>}
                  </div>
                  <span className="text-[#444444] font-mono text-xs">{activity.time}</span>
                </div>
              ))}
            </div>          </div>        </div>      </main>
      
      <Footer />
    </div>
  );
}

function StatBox({ label, value, color = "white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-3 md:p-4 hover:bg-[#111] transition-colors">
      <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">{label}</p>
      <p className={`text-lg md:text-xl font-mono text-${color}`}>{value}</p>
    </div>
  );
}
