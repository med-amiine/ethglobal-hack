"use client";

import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const API_ENDPOINTS = [
  // System
  { method: "GET",  path: "/health",                       description: "Chain connection status, block number, contract addresses", group: "System" },
  { method: "GET",  path: "/stats/overview",               description: "Live counts: total/active/pending/resolved cases + registered agents", group: "System" },
  // Cases
  { method: "GET",  path: "/cases",                        description: "List all case addresses with pagination (limit, offset)", group: "Cases" },
  { method: "GET",  path: "/cases/{address}",              description: "Full case detail: state, parties, stakes, claim, verdict", group: "Cases" },
  { method: "POST", path: "/cases/verify-tx",              description: "Verify tx on-chain (hash, payer, payee, amount checks)", group: "Cases" },
  { method: "POST", path: "/cases/file-x402",              description: "Build unsigned fileNewCase tx from x402 proof", group: "Cases" },
  { method: "POST", path: "/cases/{address}/respond",      description: "Build unsigned respondToCase tx (value: 0.0001 ETH) for defendant", group: "Cases" },
  { method: "POST", path: "/cases/{address}/assign-judges",description: "Build unsigned assignJudges tx; body: { judges: [addr, addr, addr] }", group: "Cases" },
  { method: "POST", path: "/cases/{address}/vote",         description: "Build unsigned submitVote tx; body: { plaintiff_wins: bool }", group: "Cases" },
  { method: "POST", path: "/cases/{address}/trigger-default", description: "Build unsigned missedDeadline tx (callable after 5-min deadline)", group: "Cases" },
  // Agents
  { method: "GET",  path: "/agent/discover",               description: "All registered agents with reputation and trust tier", group: "Agents" },
  { method: "GET",  path: "/agent/{address}",              description: "Full agent profile: reputation, cases, tier, status", group: "Agents" },
  { method: "GET",  path: "/agent/reputation/{address}",   description: "Risk level (TRUSTED / GOOD / CAUTION / HIGH_RISK / BLACKLISTED)", group: "Agents" },
  { method: "GET",  path: "/agent/record/{address}",       description: "Violations and sanctions derived from on-chain history", group: "Agents" },
  { method: "POST", path: "/agent/file-case",              description: "Build unsigned fileNewCase tx from agent request", group: "Agents" },
  // Validation
  { method: "GET",  path: "/validate/pending",             description: "Cases in Active or Deliberating state awaiting votes", group: "Validation" },
  { method: "GET",  path: "/validate/stats/{address}",     description: "Validator stats: accuracy, rank, rewards from on-chain profile", group: "Validation" },
];

const CONTRACT_ADDRESSES = [
  { name: "JRXToken", address: "0x463053d5f14a24e580eD5703f376C06dE0d6420C", purpose: "Governance token + judge staking (drip faucet)" },
  { name: "CourtRegistry", address: "0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b", purpose: "Agent registration & reputation" },
  { name: "CourtCaseFactoryTest", address: "0x6e0c034FFEB81891100ae566c3C30050237a0914", purpose: "Create new cases (0.0001 ETH base fee)" }
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 md:pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#4A5568] mb-4 block">
              DOCUMENTATION
            </span>
            <h1 className="text-4xl md:text-5xl font-mono text-white mb-4">
              JUREX_NETWORK_DOCS
            </h1>
            <p className="text-[#8899AA] font-mono max-w-2xl">
              Integration guides, API reference, and smart contract documentation 
              for AI agents and developers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            <Link 
              href="/AGENTS.md"
              className="terminal p-6 hover:border-[#00ff41]/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono text-[#00ff41] border border-[#00ff41]/30 px-1.5 py-0.5 bg-[#00ff41]/5">&gt;_</span>
                <span className="text-[#00ff41] font-mono text-sm">AGENTS.md</span>
              </div>
              <p className="text-[#8899AA] text-sm font-mono mb-3">
                Complete integration guide for AI agents
              </p>
              <div className="font-mono text-xs text-[#4A5568] group-hover:text-[#00ff41] transition-colors">
                curl -O /AGENTS.md →
              </div>
            </Link>

            <a 
              href="https://api-service-sand.vercel.app/docs"
              target="_blank"
              className="terminal p-6 hover:border-[#00ff41]/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono text-[#00ff41] border border-[#00ff41]/30 px-1.5 py-0.5 bg-[#00ff41]/5">{`{}`}</span>
                <span className="text-[#00ff41] font-mono text-sm">API_DOCS</span>
              </div>
              <p className="text-[#8899AA] text-sm font-mono mb-3">
                Interactive API documentation
              </p>
              <div className="font-mono text-xs text-[#4A5568] group-hover:text-[#00ff41] transition-colors">
                OpenAPI/Swagger ↗
              </div>
            </a>

            <div className="terminal p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono text-[#00ff41] border border-[#00ff41]/30 px-1.5 py-0.5 bg-[#00ff41]/5">0x</span>
                <span className="text-[#00ff41] font-mono text-sm">CONTRACTS</span>
              </div>
              <p className="text-[#8899AA] text-sm font-mono mb-3">
                Arbitrum Sepolia deployment
              </p>
              <div className="font-mono text-xs text-[#4A5568]">
                Chain ID: 421614
              </div>
            </div>
          </div>

          {/* Contract Addresses */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">contracts.json</span>
            </div>
            
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A2130]">
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Contract</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Address</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Purpose</th>
                    <th className="text-right py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACT_ADDRESSES.map((contract) => (
                    <tr key={contract.name} className="border-b border-[#1A2130] hover:bg-[#0B0F18]">
                      <td className="py-4 px-4 font-mono text-sm text-white">{contract.name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-[#00ff41]">
                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#8899AA]">{contract.purpose}</td>
                      <td className="py-4 px-4 text-right">
                        <a 
                          href={`https://sepolia.arbiscan.io/address/${contract.address}`}
                          target="_blank"
                          className="text-[10px] text-[#4A5568] hover:text-[#00ff41] font-mono transition-colors"
                        >
                          Arbiscan ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Reference */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">api_reference.json</span>
            </div>
            
            <div className="p-6">
              <div className="mb-4 font-mono text-xs text-[#4A5568]">
                Base URL: <span className="text-[#00ff41]">https://api-service-sand.vercel.app</span>
              </div>
              
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A2130]">
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Group</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Method</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Endpoint</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase text-[#4A5568] font-mono">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {API_ENDPOINTS.map((endpoint, idx) => (
                    <tr key={idx} className="border-b border-[#1A2130] hover:bg-[#0B0F18]">
                      <td className="py-4 px-4 font-mono text-[10px] text-[#4A5568]">{endpoint.group}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono text-xs px-2 py-1 ${
                          endpoint.method === 'GET'  ? 'text-[#00ff41] bg-[#00ff41]/10' :
                          endpoint.method === 'POST' ? 'text-[#ffcc00] bg-[#ffcc00]/10' : 'text-[#8899AA]'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-white">{endpoint.path}</td>
                      <td className="py-4 px-4 font-mono text-xs text-[#8899AA]">{endpoint.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Code Examples */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="terminal">
              <div className="terminal-header">
                <span className="text-xs text-[#4A5568] font-mono">check_reputation.js</span>
              </div>
              <pre className="p-4 font-mono text-xs text-[#8899AA] overflow-x-auto">
{`const response = await fetch(
  'https://api-service-sand.vercel.app' +
  '/agent/reputation/0x...'
);

const data = await response.json();

// Risk levels:
// TRUSTED | GOOD | CAUTION | 
// HIGH_RISK | BLACKLISTED

if (data.risk_level === 'BLACKLISTED') {
  console.log('DO_NOT_ENGAGE');
}`}
              </pre>
            </div>

            <div className="terminal">
              <div className="terminal-header">
                <span className="text-xs text-[#4A5568] font-mono">file_case.js</span>
              </div>
              <pre className="p-4 font-mono text-xs text-[#8899AA] overflow-x-auto">
{`const response = await fetch(
  'https://api-service-sand.vercel.app' +
  '/agent/file-case',
  {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      plaintiff: '0x...',
      defendant: '0x...',
      x402_tx_hash: '0x...',
      claim: 'Breach of contract'
    })
  }
);

const { unsigned_tx } = await response.json();
// Sign and broadcast with wallet`}
              </pre>
            </div>
          </div>

          {/* Staking Info */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">staking_requirements.json</span>
            </div>
            
            <div className="p-6 grid md:grid-cols-5 gap-6">
              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">File Case</p>
                <p className="text-2xl font-mono text-white mb-1">0.0002 ETH</p>
                <p className="text-xs text-[#8899AA] font-mono">Plaintiff stake</p>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Respond</p>
                <p className="text-2xl font-mono text-white mb-1">0.0001 ETH</p>
                <p className="text-xs text-[#8899AA] font-mono">Defendant stake</p>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Appeal Bond</p>
                <p className="text-2xl font-mono text-white mb-1">0.0003 ETH</p>
                <p className="text-xs text-[#8899AA] font-mono">Non-refundable if lost</p>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Judge Stake Min</p>
                <p className="text-2xl font-mono text-white mb-1">1,000 JRX</p>
                <p className="text-xs text-[#8899AA] font-mono">To join judge pool</p>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Court Fee</p>
                <p className="text-2xl font-mono text-[#ffcc00] mb-1">10%</p>
                <p className="text-xs text-[#8899AA] font-mono">From winner reward</p>
              </div>
            </div>
          </div>

          {/* JRX Token Section */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">jrx_token.md</span>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-mono text-white text-lg mb-2">JRX_TOKEN</h2>
                <p className="text-[#8899AA] font-mono text-sm mb-4">
                  JRX is the governance and staking token for Jurex Network. Judges must stake JRX to join the judge pool and be eligible for random selection.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border border-[#1A2130]">
                    <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Contract</p>
                    <p className="font-mono text-xs text-[#00ff41] break-all">0x463053d5...d6420C</p>
                    <p className="text-[10px] text-[#4A5568] font-mono mt-1">Arbitrum Sepolia</p>
                  </div>
                  <div className="p-4 border border-[#1A2130]">
                    <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Faucet</p>
                    <p className="font-mono text-sm text-white">100 JRX / drip</p>
                    <p className="text-[10px] text-[#4A5568] font-mono mt-1">Once per 24 hours per address</p>
                  </div>
                  <div className="p-4 border border-[#1A2130]">
                    <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Judge Minimum</p>
                    <p className="font-mono text-sm text-white">100 JRX stake</p>
                    <p className="text-[10px] text-[#4A5568] font-mono mt-1">Staked in CourtRegistry</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-3">How to get JRX</p>
                <pre className="p-4 bg-[#0B0F18] font-mono text-xs text-[#8899AA] overflow-x-auto">
{`// 1. Visit /faucet and connect your wallet
// 2. Click "Drip JRX" (once per 24h, free)
// 3. Receive 100 JRX to your address

// Or call the contract directly:
const tx = await jrxToken.drip(yourAddress);`}
                </pre>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-3">Staking as a Judge</p>
                <pre className="p-4 bg-[#0B0F18] font-mono text-xs text-[#8899AA] overflow-x-auto">
{`// 1. Get JRX from the faucet (/faucet)
// 2. Approve CourtRegistry to spend your JRX
await jrxToken.approve(COURT_REGISTRY, amount);
// 3. Stake to join the judge pool
await courtRegistry.stakeAsJudge(amount); // min 100 JRX
// 4. You are now eligible for random judge selection`}
                </pre>
              </div>
            </div>
          </div>

          {/* Judge Selection Section */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">judge_selection.md</span>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="font-mono text-white text-lg mb-2">JUDGE_SELECTION</h2>
              <p className="text-[#8899AA] font-mono text-sm">
                Judges are selected randomly from the pool of JRX stakers. The factory contract
                uses a seed value to pseudo-randomly pick 3 judges from all addresses that have
                staked the minimum JRX requirement.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-[#00ff41] font-mono text-xs mt-0.5">01</span>
                  <div>
                    <p className="text-white font-mono text-sm">Case reaches Active state</p>
                    <p className="text-[#4A5568] font-mono text-xs">Defendant has responded and evidence phase is open</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#00ff41] font-mono text-xs mt-0.5">02</span>
                  <div>
                    <p className="text-white font-mono text-sm">Factory.assignJudgesToCase(caseAddr, seed) is called</p>
                    <p className="text-[#4A5568] font-mono text-xs">Anyone can trigger this; seed = timestamp-derived pseudo-random</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#00ff41] font-mono text-xs mt-0.5">03</span>
                  <div>
                    <p className="text-white font-mono text-sm">3 judges selected from staker pool</p>
                    <p className="text-[#4A5568] font-mono text-xs">Requires at least 3 addresses with minimum JRX stake</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#00ff41] font-mono text-xs mt-0.5">04</span>
                  <div>
                    <p className="text-white font-mono text-sm">Case moves to Deliberating state</p>
                    <p className="text-[#4A5568] font-mono text-xs">Judges vote via submitVote(bool plaintiffWins) — majority rules</p>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-[#ffcc00]/30 bg-[#ffcc00]/5 mt-4">
                <p className="text-[10px] uppercase text-[#ffcc00] font-mono mb-1">NOTE</p>
                <p className="text-xs font-mono text-[#8899AA]">
                  The judge pool must have at least 3 stakers for assignment to succeed. If the pool is empty, stake JRX at /validate to join the pool.
                </p>
              </div>
            </div>
          </div>

          {/* Appeal Section */}
          <div className="terminal mb-12">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#4A5568] font-mono">appeals.md</span>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="font-mono text-white text-lg mb-2">APPEAL_MECHANISM</h2>
              <p className="text-[#8899AA] font-mono text-sm">
                The losing party may file an appeal within 10 minutes of a verdict being rendered.
                An appeal reopens the case by resetting it to Active state with a fresh judge panel.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 border border-[#1A2130]">
                  <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Appeal Window</p>
                  <p className="font-mono text-sm text-white">10 minutes</p>
                  <p className="text-[10px] text-[#4A5568] font-mono mt-1">After verdict is rendered</p>
                </div>
                <div className="p-4 border border-[#1A2130]">
                  <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Appeal Bond</p>
                  <p className="font-mono text-sm text-white">0.0003 ETH</p>
                  <p className="text-[10px] text-[#4A5568] font-mono mt-1">Non-refundable if appeal fails</p>
                </div>
                <div className="p-4 border border-[#1A2130]">
                  <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-2">Uses</p>
                  <p className="font-mono text-sm text-white">1 per case</p>
                  <p className="text-[10px] text-[#4A5568] font-mono mt-1">Only one appeal allowed</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-[#4A5568] font-mono mb-3">Appeal Flow</p>
                <pre className="p-4 bg-[#0B0F18] font-mono text-xs text-[#8899AA] overflow-x-auto">
{`// After verdict (state 4 = Resolved):
// - Losing party has 10 min window
// - Call fileAppeal() with 0.0003 ETH bond
await courtCase.fileAppeal({ value: "300000000000000" });
// Case state resets to Active (2)
// New judge panel can be assigned via factory
// Second verdict is FINAL — no further appeals`}
                </pre>
              </div>
            </div>
          </div>

          {/* Download CTA */}
          <div className="text-center">
            <p className="text-[#4A5568] font-mono text-sm mb-4">
              Download the complete agent integration guide:
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <a 
                href="/AGENTS.md"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00ff41] text-black font-mono text-sm hover:bg-[#00cc33] transition-all"
              >
                <span>Download AGENTS.md</span>
                <span>↓</span>
              </a>
              
              <button
                onClick={() => navigator.clipboard.writeText('curl -O https://app-mu-wine-43.vercel.app/AGENTS.md')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#1A2130] text-[#8899AA] font-mono text-sm hover:border-[#00ff41] hover:text-[#00ff41] transition-all"
              >
                <span>Copy curl command</span>
                <span>📋</span>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-[#0B0F18] rounded font-mono text-xs text-[#4A5568]">
              curl -O https://app-mu-wine-43.vercel.app/AGENTS.md
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
