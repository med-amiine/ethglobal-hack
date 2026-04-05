"use client";

import { useTheme } from "../context/ThemeContext";

const standards = [
  {
    id: "ERC-8004",
    name: "Reputation Registry",
    description: "CourtRegistry implements IERC8004ReputationRegistry. Every verdict is a portable onchain feedback signal — readable by any ERC-8004 consumer across the ecosystem.",
    link: "https://eips.ethereum.org/EIPS/eip-8004",
    status: "IMPLEMENTED",
    tag: "IDENTITY + REPUTATION",
  },
  {
    id: "ERC-8183",
    name: "Agentic Commerce Hook",
    description: "AgentCourtHook implements IACPHook. Disputed ERC-8183 job rejections route to Agent Court for binding arbitration. Verdict applies back to the job contract via complete() or reject().",
    link: "https://eips.ethereum.org/EIPS/eip-8183",
    status: "IMPLEMENTED",
    tag: "DISPUTE RESOLUTION",
  },
  {
    id: "x402",
    name: "HTTP Payment Protocol",
    description: "Native support for HTTP 402 payment receipts as dispute evidence. Agents that transact via x402 can file cases using their payment proof — no manual evidence required.",
    link: "https://x402.org",
    status: "INTEGRATED",
    tag: "PAYMENTS",
  },
  {
    id: "IPFS + Filecoin",
    name: "Decentralized Storage",
    description: "All case evidence is pinned to IPFS via Pinata and persisted on Filecoin. Evidence CIDs are stored onchain — immutable, content-addressed, and verifiable.",
    link: "https://filecoin.io",
    status: "LIVE",
    tag: "STORAGE",
  },
];

export function ProtocolStandards() {
  const { mode } = useTheme();
  const isHuman = mode === "human";

  if (isHuman) {
    return (
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">Protocol Standards</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-slate-900 mb-2">Built on Open Standards</h2>
            <p className="text-slate-500 text-sm">Agent Court implements the emerging protocols that power the agentic economy.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {standards.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 p-6 rounded-sm hover:border-blue-200 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-2">{s.tag}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-lg">{s.id}</span>
                      <span className="text-slate-400 text-sm">—</span>
                      <span className="text-slate-600 text-sm font-medium">{s.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{s.status}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{s.description}</p>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 font-mono group-hover:underline"
                >
                  {s.link} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Agent / terminal mode
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 hex-grid opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">{"//"} PROTOCOL_STANDARDS</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#1a1a1a] to-transparent" />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-mono text-white mb-2">OPEN_STANDARDS</h2>
          <p className="text-[#444444] font-mono text-sm">Agent Court implements the protocols powering the agentic economy.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {standards.map((s) => (
            <div
              key={s.id}
              className="bg-[#0B0F18]/60 border border-[#1a1a1a] p-6 group relative overflow-hidden backdrop-blur-sm hover:border-[#00ff41]/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#00ff41]/60 uppercase tracking-wider block mb-1">{s.tag}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#00ff41] text-lg">{s.id}</span>
                      <span className="text-[#333333] text-sm">—</span>
                      <span className="text-[#888888] font-mono text-sm">{s.name}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#00ff41] border border-[#00ff41]/30 px-2 py-0.5">{s.status}</span>
                </div>
                <p className="text-[#555555] text-sm leading-relaxed mb-4 font-mono">{s.description}</p>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-[#333333] hover:text-[#00ff41] transition-colors group-hover:text-[#00ff41]/60"
                >
                  {s.link} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
