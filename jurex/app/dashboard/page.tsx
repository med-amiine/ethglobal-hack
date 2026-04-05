"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useCasesByAgent, useCaseDetails } from "@/lib/contract-hooks";
import { formatEther } from "viem";

const STATE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "FILED", color: "text-[#ffcc00]" },
  1: { label: "SUMMONED", color: "text-[#ffcc00]" },
  2: { label: "ACTIVE", color: "text-[#00ff41]" },
  3: { label: "DELIBERATING", color: "text-[#00ff41]" },
  4: { label: "RESOLVED", color: "text-[#666666]" },
  5: { label: "DISMISSED", color: "text-[#444444]" },
  6: { label: "DEFAULTED", color: "text-[#ff3366]" },
  7: { label: "APPEALED", color: "text-[#ffcc00]" },
};

function CaseRow({
  caseAddress,
  userAddress,
  role,
}: {
  caseAddress: string;
  userAddress: string;
  role: "plaintiff" | "defendant";
}) {
  const { state, plaintiff, defendant, plaintiffStake, defendantStake, plaintiffWins, filedAt } =
    useCaseDetails(caseAddress);

  const caseState = state.data !== undefined ? Number(state.data) : null;
  const stateInfo = caseState !== null ? STATE_LABELS[caseState] : null;
  const pStake = plaintiffStake.data ? parseFloat(formatEther(plaintiffStake.data as bigint)) : 0;
  const dStake = defendantStake.data ? parseFloat(formatEther(defendantStake.data as bigint)) : 0;
  const totalStake = (pStake + dStake).toFixed(4);

  const isResolved = caseState === 4 || caseState === 6;
  const isDefaulted = caseState === 6;
  const won = isResolved
    ? isDefaulted
      ? role === "plaintiff"
      : role === "plaintiff"
        ? plaintiffWins.data === true
        : plaintiffWins.data === false
    : null;

  const counterparty =
    role === "plaintiff"
      ? (defendant.data as string | undefined)
      : (plaintiff.data as string | undefined);

  const filedAtTs = filedAt.data ? Number(filedAt.data) : 0;
  const now = Math.floor(Date.now() / 1000);
  const diff = now - filedAtTs;
  const filedAgo =
    filedAtTs === 0
      ? "—"
      : diff < 3600
      ? `${Math.floor(diff / 60)}m ago`
      : diff < 86400
      ? `${Math.floor(diff / 3600)}h ago`
      : `${Math.floor(diff / 86400)}d ago`;

  if (state.isLoading) {
    return (
      <tr className="border-b border-[#1a1a1a]">
        <td colSpan={5} className="py-3 px-4 text-[#333333] font-mono text-xs">
          Loading {caseAddress.slice(0, 10)}...
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors group">
      <td className="py-3 px-4">
        <Link
          href={`/cases/${caseAddress}`}
          className="font-mono text-[#00ff41] text-xs hover:underline"
        >
          {caseAddress.slice(0, 10)}...{caseAddress.slice(-6)}
        </Link>
      </td>
      <td className="py-3 px-4 font-mono text-[#888888] text-xs">
        {counterparty
          ? `${counterparty.slice(0, 8)}...${counterparty.slice(-4)}`
          : "—"}
      </td>
      <td className="py-3 px-4">
        {stateInfo ? (
          <span className={`font-mono text-xs ${stateInfo.color}`}>{stateInfo.label}</span>
        ) : (
          <span className="text-[#333333] font-mono text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4 font-mono text-white text-xs">{totalStake} ETH</td>
      <td className="py-3 px-4">
        {won !== null ? (
          <span className={`font-mono text-xs font-bold ${won ? "text-[#00ff41]" : "text-[#ff3366]"}`}>
            {won ? "WON" : "LOST"}
          </span>
        ) : (
          <span className="text-[#444444] font-mono text-xs">{filedAgo}</span>
        )}
      </td>
    </tr>
  );
}

function CaseTable({
  caseAddresses,
  userAddress,
  role,
  emptyLabel,
}: {
  caseAddresses: string[];
  userAddress: string;
  role: "plaintiff" | "defendant";
  emptyLabel: string;
}) {
  if (caseAddresses.length === 0) {
    return (
      <div className="border border-[#1a1a1a] p-8 text-center">
        <p className="text-[#333333] font-mono text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1a1a1a]">
            <th className="py-2 px-4 text-left text-[10px] uppercase text-[#444444] font-mono">Case</th>
            <th className="py-2 px-4 text-left text-[10px] uppercase text-[#444444] font-mono">
              {role === "plaintiff" ? "Defendant" : "Plaintiff"}
            </th>
            <th className="py-2 px-4 text-left text-[10px] uppercase text-[#444444] font-mono">State</th>
            <th className="py-2 px-4 text-left text-[10px] uppercase text-[#444444] font-mono">Stake</th>
            <th className="py-2 px-4 text-left text-[10px] uppercase text-[#444444] font-mono">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {caseAddresses.map((addr) => (
            <CaseRow
              key={addr}
              caseAddress={addr}
              userAddress={userAddress}
              role={role}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { plaintiffCases, defendantCases, isLoading } = useCasesByAgent(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="terminal p-12 text-center">
              <span className="text-[10px] uppercase text-[#444444] font-mono">WALLET_REQUIRED</span>
              <h1 className="text-2xl font-mono text-white mt-4 mb-4">CONNECT_WALLET</h1>
              <p className="text-[#666666] font-mono text-sm">
                Connect your wallet to see cases you filed or cases filed against you.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalCases = plaintiffCases.length + defendantCases.length;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <span className="text-white">DASHBOARD</span>
          </nav>

          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">MY_CASES</span>
            <h1 className="text-3xl md:text-4xl font-mono text-white mt-2 mb-2">DASHBOARD</h1>
            <p className="text-[#444444] font-mono text-xs break-all">
              {address}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] mb-8">
            <div className="bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">TOTAL_CASES</p>
              <p className="text-2xl font-mono text-white">{isLoading ? "…" : totalCases}</p>
            </div>
            <div className="bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">FILED_BY_ME</p>
              <p className="text-2xl font-mono text-[#00ff41]">{isLoading ? "…" : plaintiffCases.length}</p>
            </div>
            <div className="bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">FILED_AGAINST_ME</p>
              <p className="text-2xl font-mono text-[#ff3366]">{isLoading ? "…" : defendantCases.length}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="terminal p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-[#00ff41] animate-pulse" />
                <span className="font-mono text-[#444444]">LOADING_CASES...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cases I Filed */}
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="ml-4 text-xs text-[#444444] font-mono">CASES_FILED_BY_ME.log</span>
                  <span className="ml-auto text-[10px] text-[#00ff41] font-mono">{plaintiffCases.length} CASES</span>
                </div>
                <div className="p-4">
                  <CaseTable
                    caseAddresses={plaintiffCases}
                    userAddress={address!}
                    role="plaintiff"
                    emptyLabel="NO_CASES_FILED — You have not filed any cases yet."
                  />
                </div>
              </div>

              {/* Cases Filed Against Me */}
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="ml-4 text-xs text-[#444444] font-mono">CASES_AGAINST_ME.log</span>
                  <span className="ml-auto text-[10px] text-[#ff3366] font-mono">{defendantCases.length} CASES</span>
                </div>
                <div className="p-4">
                  <CaseTable
                    caseAddresses={defendantCases}
                    userAddress={address!}
                    role="defendant"
                    emptyLabel="NO_CASES_AGAINST_YOU — No cases have been filed against you."
                  />
                </div>
              </div>

              {totalCases === 0 && (
                <div className="text-center py-8">
                  <Link
                    href="/file"
                    className="inline-block px-6 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41] hover:text-black transition-colors"
                  >
                    FILE_A_CASE →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
