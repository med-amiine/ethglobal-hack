"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Terminal-style clock
function TerminalClock() {
  const [time, setTime] = useState("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').slice(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-[#4A5568]">{time}</span>;
}

// Animated log lines
function SystemLog() {
  const [logs, setLogs] = useState<string[]>([
    "System heartbeat OK",
    "Node sync complete",
    "Validator pool active",
  ]);

  useEffect(() => {
    const messages = [
      "New case filed: CASE-8843",
      "Validator vote submitted",
      "Registry updated",
      "Block synced: #28472193",
      "Evidence hash verified",
    ];
    
    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => [msg, ...prev.slice(0, 2)]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] text-[#4A5568] space-y-1">
      {logs.map((log, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[#00ff41]">[{String(i).padStart(2, '0')}]</span>
          <span className={i === 0 ? 'text-[#8899AA]' : 'text-[#4A5568]'}>{log}</span>
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  const [blockNumber, setBlockNumber] = useState(28472193);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber(prev => prev + Math.floor(Math.random() * 3));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative z-10 border-t border-[#1A2130] bg-[#070B12]/80 backdrop-blur-sm">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #00ff41 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 relative">
        <div className="grid md:grid-cols-12 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-[#00ff41] flex items-center justify-center relative overflow-hidden group">
                <span className="text-[#00ff41] font-mono text-sm font-bold z-10">AC</span>
                <div className="absolute inset-0 bg-[#00ff41]/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </div>
              <span className="font-mono text-white">JUREX_NETWORK</span>
            </div>
            
            <p className="text-[#4A5568] text-sm leading-relaxed max-w-md font-mono mb-6">
              The first decentralized court for AI agent disputes.
              Built on Celo. Powered by x402.
            </p>

            <SystemLog />
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <p className="text-[10px] text-[#4A5568] font-mono mb-4">NAVIGATION</p>
            <ul className="space-y-2">
              {[
                { href: "/", label: "HOME" },
                { href: "/cases", label: "CASES" },
                { href: "/registry", label: "REGISTRY" },
                { href: "/file", label: "FILE_CASE" },
                { href: "/validate", label: "VALIDATE" },
                { href: "/docs", label: "DOCS" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group flex items-center gap-2 text-[#4A5568] hover:text-[#00ff41] text-xs font-mono transition-colors"
                  >
                    <span className="text-[#1A2130] group-hover:text-[#00ff41]">&gt;</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-3">
            <p className="text-[10px] text-[#4A5568] font-mono mb-4">RESOURCES</p>
            <ul className="space-y-2 mb-6">
              {[
                { href: "/docs", label: "DOCUMENTATION" },
                { href: "/AGENTS.md", label: "AGENTS.md", external: true },
                { href: "https://api-service-sand.vercel.app/docs", label: "API_REFERENCE", external: true },
                { href: "https://sepolia.arbiscan.io/address/0x947E8b85863E49EFF0421542078967A29E2c8DD9", label: "COURT_REGISTRY", external: true },
                { href: "https://sepolia.arbiscan.io/address/0xd3274054A6FAA8c133c03007C8449b6D8Ab70bF3", label: "CASE_FACTORY", external: true },
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    className="group flex items-center gap-2 text-[#4A5568] hover:text-[#00ff41] text-xs font-mono transition-colors"
                  >
                    <span className="text-[#1A2130] group-hover:text-[#00ff41]">&gt;</span>
                    {link.label}
                    {link.external && <span className="text-[10px]">↗</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* System Status */}
          <div className="md:col-span-3">
            <p className="text-[10px] text-[#4A5568] font-mono mb-4">SYSTEM_STATUS</p>
            
            <div className="border border-[#1A2130] p-4 bg-[#0B0F18]/80 backdrop-blur-sm">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#4A5568]">NETWORK</span>
                  <span className="text-[#00ff41]">ARBITRUM_SEPOLIA</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#4A5568]">BLOCK</span>
                  <span className="text-white tabular-nums">#{blockNumber.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#4A5568]">GAS</span>
                  <span className="text-[#ffcc00]">0.1 gwei</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#4A5568]">LATENCY</span>
                  <span className="text-[#00ff41]">24ms</span>
                </div>
                
                <div className="h-px bg-[#1A2130] my-2" />
                
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                  <span className="text-[#00ff41] text-[10px]">SYSTEM_OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EST. 2026 separator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#1A2130] to-[#1A2130]" />
          <span className="text-[10px] text-[#4A5568] font-mono">EST. 2026</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#1A2130] to-[#1A2130]" />
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-[#4A5568] font-mono">
              © {new Date().getFullYear()} JUREX_NETWORK // v2.0.1
            </p>
            <span className="text-[#1A2130]">|</span>
            <TerminalClock />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse" />
              <span className="text-[10px] text-[#00ff41] font-mono">CONNECTED</span>
            </div>
            
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 h-3 bg-[#1A2130] animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
