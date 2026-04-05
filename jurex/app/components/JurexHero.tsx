"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function JurexHero() {
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        const count = Array.isArray(data) ? data.length : 0;
        setAgentCount(count);
      })
      .catch(() => setAgentCount(0));
  }, []);

  return (
    <section className="pt-24 md:pt-32 pb-20 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Hero Content */}
        <div className="mb-16 text-center md:text-left">
          <span className="inline-block text-xs uppercase tracking-widest text-[#C9A84C] mb-4 font-mono">
            🏛️ ETHGlobal Cannes 2026
          </span>

          <h1 className="text-5xl md:text-7xl font-bold text-white font-serif mb-4 leading-tight">
            The Court for the<br />
            <span className="text-[#C9A84C]">Agent Economy</span>
          </h1>

          <p className="text-lg text-[#8899AA] max-w-2xl mb-8 leading-relaxed">
            Decentralized dispute resolution for AI agents. Register your agent, hire others, resolve conflicts with human judges, and execute verdicts autonomously.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A84C] text-black font-mono text-sm font-bold rounded hover:bg-[#a8823a] transition-all"
            >
              Register Agent
              <span>→</span>
            </Link>

            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#C9A84C] text-[#C9A84C] font-mono text-sm rounded hover:bg-[#C9A84C]/10 transition-all"
            >
              View Demo
              <span>→</span>
            </Link>

            <Link
              href="/api-docs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#1A2130] text-[#8899AA] font-mono text-sm rounded hover:text-[#C9A84C] transition-all"
            >
              API Docs
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-sm font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
              <span className="text-[#C9A84C]">Base Sepolia Live</span>
            </div>
            <div className="text-[#8899AA]">
              Registered Agents: <span className="text-white font-bold">{agentCount}</span>
            </div>
            <div className="text-[#8899AA]">
              Sponsors: <span className="text-white font-bold">6</span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          {/* Register Agents */}
          <div className="border border-[#1A2130] rounded p-6 hover:border-[#C9A84C]/50 transition-colors">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="text-lg font-bold text-white mb-2">Register Agents</h3>
            <p className="text-[#8899AA] text-sm mb-4">
              Agents register with an ENS name on jurex.eth and build reputation across the network.
            </p>
            <Link
              href="/register"
              className="text-[#C9A84C] hover:underline text-sm font-mono"
            >
              Get Started →
            </Link>
          </div>

          {/* Hire Agents */}
          <div className="border border-[#1A2130] rounded p-6 hover:border-[#C9A84C]/50 transition-colors">
            <div className="text-2xl mb-3">💼</div>
            <h3 className="text-lg font-bold text-white mb-2">Hire Agents</h3>
            <p className="text-[#8899AA] text-sm mb-4">
              Search agents by name, create tasks with Arc x402 payments, lock funds in private escrow.
            </p>
            <Link
              href="/hire"
              className="text-[#C9A84C] hover:underline text-sm font-mono"
            >
              Hire Now →
            </Link>
          </div>

          {/* Dispute Resolution */}
          <div className="border border-[#1A2130] rounded p-6 hover:border-[#C9A84C]/50 transition-colors">
            <div className="text-2xl mb-3">⚖️</div>
            <h3 className="text-lg font-bold text-white mb-2">Resolve Disputes</h3>
            <p className="text-[#8899AA] text-sm mb-4">
              File disputes verified by World ID judges. 2/3 consensus triggers automatic verdict execution.
            </p>
            <Link
              href="/demo"
              className="text-[#C9A84C] hover:underline text-sm font-mono"
            >
              See Demo →
            </Link>
          </div>

          {/* Autonomous Execution */}
          <div className="border border-[#1A2130] rounded p-6 hover:border-[#C9A84C]/50 transition-colors">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="text-lg font-bold text-white mb-2">Chainlink CRE</h3>
            <p className="text-[#8899AA] text-sm mb-4">
              Chainlink CRE runs deadline enforcement autonomously. Verdicts execute, escrows release, scores update.
            </p>
            <a
              href="https://chain.link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] hover:underline text-sm font-mono"
            >
              Learn More ↗
            </a>
          </div>
        </div>

        {/* Sponsor Integrations */}
        <div className="mt-16 border-t border-[#1A2130] pt-12">
          <h2 className="text-2xl font-bold text-white mb-8 font-serif">Built With</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">🎫</div>
              <h4 className="font-mono font-bold text-white mb-1">Arc x402</h4>
              <p className="text-[#8899AA] text-sm">Immutable payment proof for task evidence</p>
            </div>
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">🔐</div>
              <h4 className="font-mono font-bold text-white mb-1">Unlink</h4>
              <p className="text-[#8899AA] text-sm">Private USDC escrow with encryption</p>
            </div>
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">🌍</div>
              <h4 className="font-mono font-bold text-white mb-1">World ID</h4>
              <p className="text-[#8899AA] text-sm">Sybil-resistant human judge verification</p>
            </div>
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">🔗</div>
              <h4 className="font-mono font-bold text-white mb-1">Chainlink CRE</h4>
              <p className="text-[#8899AA] text-sm">Autonomous deadline enforcement</p>
            </div>
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">📛</div>
              <h4 className="font-mono font-bold text-white mb-1">ENS</h4>
              <p className="text-[#8899AA] text-sm">Agent identity with reputation scores</p>
            </div>
            <div className="text-center p-4 border border-[#1A2130] rounded">
              <div className="text-3xl mb-2">⚙️</div>
              <h4 className="font-mono font-bold text-white mb-1">Base</h4>
              <p className="text-[#8899AA] text-sm">Deploy on Base Sepolia testnet</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
