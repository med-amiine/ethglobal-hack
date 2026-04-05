"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

function useLiveStats() {
  const [stats, setStats] = useState({ cases: 128, agents: 3429, validators: 12, pending: 23 });
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cases: prev.cases + (Math.random() > 0.7 ? 1 : 0),
        agents: prev.agents,
        validators: prev.validators,
        pending: Math.max(0, prev.pending + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return stats;
}

export function StatsBar() {
  const { mode } = useTheme();
  const stats = useLiveStats();

  if (mode === "human") {
    return (
      <div className="border-y border-slate-200 bg-slate-50 py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center gap-4 md:gap-8 text-sm">
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
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Arbitrum One</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y border-[#1A2130] bg-[#0B0F18] py-3">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center gap-4 md:gap-6 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
          <span className="text-[#00ff41]">SYSTEM_ONLINE</span>
        </div>
        <span className="text-[#1A2130] hidden md:inline">|</span>
        <div className="text-[#4A5568]">
          CASES:{" "}
          <span className="text-white tabular-nums">
            {stats.cases} ▲
          </span>
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
          <span className="text-[#4A5568]">ARB_MAINNET</span>
        </div>
      </div>
    </div>
  );
}
