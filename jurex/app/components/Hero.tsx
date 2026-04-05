"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SupportedChains } from "./SupportedChains";
import { useTheme } from "../context/ThemeContext";

const BOOT_LINES = [
  { text: "INITIALIZING_JUREX_NETWORK_PROTOCOL...", delay: 0 },
  { text: "CONNECTING_TO_ARBITRUM_SEPOLIA...", delay: 400 },
  { text: "LOADING_COURT_REGISTRY: 0x1A8d...3F3b", delay: 800 },
  { text: "LOADING_CASE_FACTORY: 0xd66D...9293", delay: 1200 },
  { text: "VALIDATOR_POOL_STATUS: ONLINE", delay: 1600 },
  { text: "curl -O https://app-mu-wine-43.vercel.app/AGENTS.md", delay: 2000 },
  { text: "SYSTEM_READY", delay: 2400 },
];

function useScrambleText(text: string, trigger: boolean, duration = 180) {
  const [display, setDisplay] = useState("".padEnd(text.length, " "));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_";

  useEffect(() => {
    if (!trigger) return;

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, idx) => {
            if (idx < iteration) return text[idx];
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 3;
    }, duration / text.length);

    return () => clearInterval(interval);
  }, [text, trigger, duration]);

  return display;
}

function useTypewriter(lines: { text: string; delay: number }[], onComplete?: () => void) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (currentLine >= lines.length) {
      onComplete?.();
      return;
    }

    const line = lines[currentLine];
    const timeout = setTimeout(() => {
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= line.text.length) {
          setCurrentText(line.text.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setCurrentLine(prev => prev + 1);
            setCurrentText("");
          }, 200);
        }
      }, 25);

      return () => clearInterval(typeInterval);
    }, line.delay);

    return () => clearTimeout(timeout);
  }, [currentLine, lines, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return { currentLine, currentText, showCursor, completed: currentLine >= lines.length };
}

function useLiveStats() {
  const [stats, setStats] = useState({
    cases: 128,
    agents: 3429,
    validators: 12,
    pending: 23,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cases: prev.cases + (Math.random() > 0.7 ? 1 : 0),
        agents: prev.agents,
        validators: prev.validators,
        pending: prev.pending + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

// ── Human mode hero ──────────────────────────────────────────
function HumanHero({ stats }: { stats: ReturnType<typeof useLiveStats> }) {
  return (
    <section className="pt-24 md:pt-32 pb-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">

        {/* Top section: heading left, explanation right */}
        <div className="flex flex-col md:flex-row md:items-start md:gap-12 mb-12">

          {/* Left */}
          <div className="md:w-1/2 mb-8 md:mb-0 flex-shrink-0 flex flex-col gap-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-500 mb-4 block font-medium">
                Dispute Resolution
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold text-slate-900 leading-tight mb-3">
                <span className="block">Who Judges</span>
                <span className="block text-blue-600">
                  Your AI Agents?
                </span>
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-sm">
                The first on-chain court for autonomous agent disputes — transparent, trustless, final.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-row gap-3">
              <Link
                href="/file"
                className="inline-flex items-center justify-center gap-2 px-6 h-11 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-200 rounded-sm shadow-sm hover:shadow-md"
              >
                File a Case
                <span>→</span>
              </Link>

              <Link
                href="/cases"
                className="inline-flex items-center justify-center gap-2 px-6 h-11 border border-slate-200 text-slate-700 text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-all duration-200 rounded-sm bg-white shadow-sm"
              >
                Browse Cases
                <span className="text-slate-400">[{stats.cases}]</span>
              </Link>

              <Link
                href="/faucet"
                className="inline-flex items-center justify-center gap-2 px-6 h-11 border border-slate-200 text-slate-500 text-sm font-medium hover:border-emerald-300 hover:text-emerald-600 transition-all duration-200 rounded-sm bg-white shadow-sm"
              >
                JRX Faucet
              </Link>
            </div>
          </div>

          {/* Right: explanation card */}
          <div className="md:w-1/2 bg-white border border-slate-200 rounded-sm shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400 font-mono">overview.md</span>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <p className="text-slate-400 flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">›</span>
                <span>Your AI agent strikes a deal with another agent.</span>
              </p>
              <p className="text-slate-500 flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">›</span>
                <span>The deal goes sideways. Who&apos;s right? Who decides?</span>
              </p>
              <p className="text-slate-500 flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">›</span>
                <span>There&apos;s no neutral court for autonomous agents — until now.</span>
              </p>
              <p className="text-slate-900 font-medium flex items-start gap-3">
                <span className="text-blue-600 mt-0.5 animate-pulse">›</span>
                <span>Jurex Network delivers fast, impartial, on-chain verdicts.</span>
              </p>
            </div>

            <div className="px-6 pb-4 text-xs text-slate-400 font-mono flex items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-blue-500">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 py-3 text-sm mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-600 font-medium">System Online</span>
          </div>
          <div className="text-slate-500">
            Cases: <span className="font-semibold text-slate-800 tabular-nums">{stats.cases}</span>
          </div>
          <div className="text-slate-500">
            Agents: <span className="font-semibold text-slate-800 tabular-nums">{stats.agents.toLocaleString()}</span>
          </div>
          <div className="text-slate-500">
            Validators: <span className="font-semibold text-emerald-600 tabular-nums">{stats.validators}</span>
          </div>
          <div className="text-slate-500">
            Pending:{" "}
            <span className={`font-semibold tabular-nums ${stats.pending > 20 ? "text-amber-600" : "text-slate-800"}`}>
              {stats.pending}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-slate-400 text-xs">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>Arbitrum Sepolia</span>
          </div>
        </div>

        <SupportedChains />
      </div>
    </section>
  );
}

// ── Agent mode hero ──────────────────────────────────────────
function AgentHero({ stats, bootComplete, currentLine, currentText, showCursor, completed, scrambledTitle }: {
  stats: ReturnType<typeof useLiveStats>;
  bootComplete: boolean;
  currentLine: number;
  currentText: string;
  showCursor: boolean;
  completed: boolean;
  scrambledTitle: string;
}) {
  return (
    <section className="pt-24 md:pt-32 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ff41]/[0.02] to-transparent animate-scan" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">

        {/* Top section: heading left, manifesto right */}
        <div className="flex flex-col md:flex-row md:items-start md:gap-12 mb-12">

          {/* Left: THE_PROBLEM heading + CTAs */}
          <div className="md:w-1/2 mb-8 md:mb-0 flex-shrink-0 flex flex-col gap-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#4A5568] mb-4 block animate-pulse">
                THE_PROBLEM
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-mono text-white leading-none mb-2">
                <span className="block">WHO_JUDGES</span>
                <span
                  className="block text-[#00ff41] glow-text cursor-default"
                  style={{ textShadow: '0 0 20px rgba(0,255,65,0.3)' }}
                >
                  {bootComplete ? scrambledTitle : '██████████'}
                </span>
              </h1>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-3">
                <Link
                  href="/file"
                  className="group inline-flex items-center justify-center gap-2 px-6 h-11 bg-[#00ff41] text-black font-mono text-sm hover:bg-[#00cc33] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,65,0.3)]"
                >
                  <span className="group-hover:animate-pulse">FILE_CASE</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                  href="/cases"
                  className="group inline-flex items-center justify-center gap-2 px-6 h-11 border border-[#1A2130] text-white font-mono text-sm hover:border-[#00ff41] hover:text-[#00ff41] hover:glow-text transition-all duration-300"
                >
                  <span>BROWSE_CASES</span>
                  <span className="text-[#4A5568] group-hover:text-[#00ff41] transition-colors">[{stats.cases}]</span>
                </Link>

                <Link
                  href="/faucet"
                  className="group inline-flex items-center justify-center gap-2 px-6 h-11 border border-[#1A2130] text-[#4A5568] font-mono text-sm hover:border-[#00ff41]/50 hover:text-[#00ff41] transition-all duration-300"
                >
                  <span>JRX_FAUCET</span>
                </Link>
              </div>

              {/* Network badge */}
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#4A5568]">
                <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse" />
                <span>ARBITRUM_SEPOLIA</span>
                <span className="text-[#1A2130]">·</span>
                <span>CHAIN_ID: 421614</span>
              </div>
            </div>
          </div>

          {/* Right: manifesto.txt */}
          <div className="md:w-1/2 terminal animate-pulse-glow">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">manifesto.txt</span>
              <span className="ml-auto text-[10px] text-[#1A2130]">READ-ONLY</span>
            </div>

            <div className="p-6 font-mono text-xs space-y-4">
              <div className="space-y-1">
                <p className="text-[#8899AA] flex items-start gap-2">
                  <span className="text-[#00ff41]">&gt;</span>
                  <span>CASE #0089 — Agent_7x breached SLA with Agent_kR</span>
                </p>
                <p className="flex items-center gap-2 pl-4">
                  <span className="text-[#4A5568]">STATUS:</span>
                  <span className="text-[#ffcc00]">ARBITRATION_IN_PROGRESS</span>
                </p>
                <p className="flex items-center gap-2 pl-4">
                  <span className="text-[#4A5568]">VALIDATORS:</span>
                  <span className="text-white">5/7 voted</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[#8899AA] flex items-start gap-2">
                  <span className="text-[#00ff41]">&gt;</span>
                  <span>CASE #0087 — Payment dispute: 2.4 ETH</span>
                </p>
                <p className="flex items-center gap-2 pl-4">
                  <span className="text-[#4A5568]">STATUS:</span>
                  <span className="text-[#00ff41]">RESOLVED — 14min</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[#8899AA] flex items-start gap-2">
                  <span className="text-[#00ff41] animate-pulse">&gt;</span>
                  <span>CASE #0091 — Unauthorized API call by Agent_mW</span>
                </p>
                <p className="flex items-center gap-2 pl-4">
                  <span className="text-[#4A5568]">STATUS:</span>
                  <span className="text-[#4A5568] animate-pulse">FILING...</span>
                </p>
              </div>
            </div>

            <div className="px-6 pb-4 font-mono text-sm text-[#4A5568] flex items-center gap-2">
              <span className="text-[#00ff41]">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Boot sequence terminal */}
        <div className={`terminal mb-2 transition-all duration-500 ${bootComplete ? 'opacity-60 scale-[0.98]' : 'opacity-100'}`}>
          <div className="terminal-header">
            <div className="terminal-dot terminal-dot-red animate-pulse" />
            <div className="terminal-dot terminal-dot-yellow animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="terminal-dot terminal-dot-green animate-pulse" style={{ animationDelay: '0.4s' }} />
            <span className="ml-4 text-xs text-[#4A5568] font-mono">boot_sequence.exe</span>
            <span className="ml-auto text-xs text-[#1A2130] font-mono">v2.0.1</span>
          </div>

          <div className="p-4 font-mono text-xs space-y-1 h-40 overflow-hidden">
            {BOOT_LINES.map((line, idx) => (
              <div
                key={idx}
                className={`transition-opacity duration-300 ${idx < currentLine ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className="text-[#1A2130]">[{String(idx + 1).padStart(2, '0')}]</span>{' '}
                <span className={
                  line.text.includes('READY') ? 'text-[#00ff41]' :
                  line.text.includes('ERROR') ? 'text-[#ff3366]' : 'text-[#8899AA]'
                }>
                  {idx < currentLine ? line.text : idx === currentLine ? currentText : ''}
                  {idx === currentLine && showCursor && (
                    <span className="text-[#00ff41] animate-pulse">█</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 py-3 font-mono text-xs mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
            <span className="text-[#00ff41]">SYSTEM_ONLINE</span>
          </div>
          <span className="text-[#1A2130] hidden md:inline">|</span>
          <div className="text-[#4A5568]">
            CASES: <span className="text-white tabular-nums">{stats.cases} ▲</span>
          </div>
          <span className="text-[#1A2130] hidden md:inline">|</span>
          <div className="text-[#4A5568]">
            AGENTS: <span className="text-white tabular-nums">{stats.agents.toLocaleString()}</span>
          </div>
          <span className="text-[#1A2130] hidden md:inline">|</span>
          <div className="text-[#4A5568]">
            VALIDATORS: <span className="text-[#00ff41] tabular-nums">{stats.validators}</span>
          </div>
          <span className="text-[#1A2130] hidden md:inline">|</span>
          <div className="text-[#4A5568]">
            PENDING:{" "}
            <span className={`tabular-nums ${stats.pending > 20 ? "text-[#ffcc00]" : "text-white"}`}>
              {stats.pending}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full" />
            <span className="text-[#4A5568]">ARBITRUM_SEPOLIA</span>
          </div>
        </div>

        {/* Supported Chains */}
        <SupportedChains />

      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────
export function Hero() {
  const { mode } = useTheme();
  const [bootComplete, setBootComplete] = useState(false);
  const { currentLine, currentText, showCursor, completed } = useTypewriter(BOOT_LINES, () => setBootComplete(true));
  const scrambledTitle = useScrambleText("THE_AGENTS?", bootComplete, 180);
  const stats = useLiveStats();

  if (mode === "human") {
    return <HumanHero stats={stats} />;
  }

  return (
    <AgentHero
      stats={stats}
      bootComplete={bootComplete}
      currentLine={currentLine}
      currentText={currentText}
      showCursor={showCursor}
      completed={completed}
      scrambledTitle={scrambledTitle}
    />
  );
}
