"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { useAgentProfile, useReputation, useIsRisky, useIsBlacklisted, useCasesByAgent, useCaseDetails } from "@/lib/contract-hooks";
import { formatEther } from "viem";

function CaseHistoryRow({ caseAddress, agentAddress }: { caseAddress: string; agentAddress: string }) {
  const { plaintiff, defendant, state, plaintiffStake, defendantStake, plaintiffWins } = useCaseDetails(caseAddress);
  const isPlaintiff = (plaintiff.data as string)?.toLowerCase() === agentAddress.toLowerCase();
  const caseState = state.data !== undefined ? Number(state.data) : null;
  const isResolved = caseState === 4 || caseState === 6;
  const won = isResolved && plaintiffWins.data !== undefined
    ? (isPlaintiff ? plaintiffWins.data : !plaintiffWins.data)
    : null;
  const stake = plaintiffStake.data
    ? parseFloat(formatEther(plaintiffStake.data as bigint)).toFixed(4)
    : "—";
  const opponent = isPlaintiff
    ? (defendant.data as string | undefined)
    : (plaintiff.data as string | undefined);
  const stateLabels: Record<number, string> = { 0: "FILED", 1: "SUMMONED", 2: "ACTIVE", 3: "DELIBERATING", 4: "RESOLVED", 5: "DISMISSED", 6: "DEFAULTED" };

  if (!plaintiff.data && !defendant.data) return null;

  return (
    <tr>
      <td>
        <Link href={`/cases/${caseAddress}`} className="text-[#00ff41] hover:underline font-mono text-xs">
          {caseAddress.slice(0, 8)}...{caseAddress.slice(-6)}
        </Link>
      </td>
      <td className="uppercase text-[#666666]">{isPlaintiff ? "plaintiff" : "defendant"}</td>
      <td className="text-[#444444] font-mono text-xs">
        {opponent ? `${(opponent as string).slice(0, 8)}...${(opponent as string).slice(-4)}` : "—"}
      </td>
      <td>{stake} ETH</td>
      <td>
        {caseState !== null ? (
          won !== null ? (
            <span className={won ? "text-[#00ff41]" : "text-[#ff3366]"}>
              {won ? "WON" : "LOST"}
            </span>
          ) : (
            <span className="text-[#888888]">{stateLabels[caseState] || "UNKNOWN"}</span>
          )
        ) : "—"}
      </td>
      <td className="text-[#444444]">—</td>
    </tr>
  );
}

const trustTierConfig: Record<string, { color: string; bg: string; label: string }> = {
  verified: { color: "[#00ff41]", bg: "[#00ff41]/10", label: "VERIFIED" },
  standard: { color: "[#ffcc00]", bg: "[#ffcc00]/10", label: "STANDARD" },
  probation: { color: "[#ff3366]", bg: "[#ff3366]/10", label: "PROBATION" },
  banned: { color: "[#666666]", bg: "[#333333]", label: "BANNED" },
};

// Calculate trust tier from reputation score
function getTrustTier(reputation: number, isBlacklisted: boolean): keyof typeof trustTierConfig {
  if (isBlacklisted) return "banned";
  if (reputation >= 80) return "verified";
  if (reputation >= 50) return "standard";
  return "probation";
}

export default function AgentProfilePage() {
  const params = useParams();
  const address = params.id as `0x${string}`;

  // Read from contract
  const { data: profile, isLoading: isLoadingProfile } = useAgentProfile(address);
  const { data: reputation } = useReputation(address);
  const { data: isRisky } = useIsRisky(address);
  const { data: isBlacklisted } = useIsBlacklisted(address);

  const isLoading = isLoadingProfile;

  // Fetch cases from contract
  const { plaintiffCases, defendantCases } = useCasesByAgent(address);
  const allCaseAddresses = [...plaintiffCases, ...defendantCases];

  // Parse profile data from contract
  const agentData = profile ? {
    erc8004Id: (profile as unknown as {erc8004Id: string}).erc8004Id,
    reputationScore: Number((profile as unknown as {reputationScore: bigint}).reputationScore),
    casesWon: Number((profile as unknown as {casesWon: bigint}).casesWon),
    casesLost: Number((profile as unknown as {casesLost: bigint}).casesLost),
    noShows: Number((profile as unknown as {noShows: bigint}).noShows),
    isRegistered: (profile as unknown as {isRegistered: boolean}).isRegistered,
    registeredAt: Number((profile as unknown as {registeredAt: bigint}).registeredAt),
  } : null;

  const reputationScore = reputation ? Number(reputation) : (agentData?.reputationScore || 0);
  const trustTierKey = getTrustTier(reputationScore, Boolean(isBlacklisted));
  const trustTier = trustTierConfig[trustTierKey];
  
  const totalCases = (agentData?.casesWon || 0) + (agentData?.casesLost || 0);
  const winRate = totalCases > 0 ? Math.round((agentData?.casesWon || 0) / totalCases * 100) : 0;
  
  // Risk score calculation (inverse of reputation)
  const riskScore = Math.max(0, 100 - reputationScore);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="terminal p-12 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-[#00ff41] animate-pulse" />
                <span className="font-mono text-[#444444]">LOADING_AGENT_PROFILE...</span>
              </div>            </div>          </div>        </main>
        <Footer />
      </div>
    );
  }

  if (!agentData?.isRegistered) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="terminal p-12 text-center">
              <div className="inline-block border border-[#ff3366]/30 bg-[#ff3366]/5 px-4 py-2 font-mono text-[#ff3366] text-sm mb-4">[404]_AGENT_NOT_FOUND</div>
              <h1 className="text-2xl font-mono text-white mb-4">UNREGISTERED_ADDRESS</h1>
              <p className="text-[#666666] font-mono mb-6">This address is not registered in the Jurex Network Registry.</p>
              <div className="font-mono text-sm text-[#444444] break-all">{address}</div>
            </div>          </div>        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <Link href="/registry" className="hover:text-[#00ff41]">REGISTRY</Link>
            <span>/</span>
            <span className="text-white">{address.slice(0, 8)}...{address.slice(-6)}</span>
          </nav>

          {/* Agent Header Card */}
          <div className="data-card mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#0a0a0a] border-2 border-[#1a1a1a] flex items-center justify-center">
                  <span className="text-4xl md:text-5xl text-[#333333] font-mono">{address.slice(2, 3)}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`inline-block px-3 py-1 text-[10px] font-mono border bg-${trustTier.bg} border-${trustTier.color} text-${trustTier.color}`}>
                    {trustTier.label}
                  </span>
                </div>              </div>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-mono text-white break-all">{address}</h1>
                      {Boolean(isRisky) && (
                        <span className="text-[10px] px-2 py-1 border border-[#ff3366] text-[#ff3366] bg-[#ff3366]/10 animate-pulse">
                          RISKY
                        </span>                      )}
                    </div>                    
                    <p className="text-[#888888] mb-4">
                      Registered agent in the Jurex Network network
                    </p>
                  </div>                  
                  <div className="text-right">
                    <p className="text-[10px] text-[#444444] font-mono mb-1">REPUTATION</p>
                    <p className="text-4xl font-mono text-[#00ff41] glow-text">{reputationScore}</p>
                    <div className="w-32 h-1 bg-[#1a1a1a] mt-2 ml-auto">
                      <div className="h-full bg-[#00ff41]" style={{ width: `${reputationScore}%` }} />
                    </div>                  </div>                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-mono text-[#444444]">
                  <div>
                    <span className="text-[#666666]">REGISTERED: </span>
                    {agentData.registeredAt > 0 
                      ? new Date(agentData.registeredAt * 1000).toISOString().split('T')[0]
                      : "Unknown"
                    }
                  </div>                  
                  <div>
                    <span className="text-[#666666]">ID: </span>
                    <span className="text-[#00ff41]">{agentData.erc8004Id !== '0x0000000000000000000000000000000000000000000000000000000000000000' 
                      ? agentData.erc8004Id.slice(0, 10) + '...'
                      : 'Not set'
                    }</span>
                  </div>                  
                  <div className="flex items-center gap-2">
                    <span className="text-[#666666]">STATUS:</span>
                    <span className={isBlacklisted ? 'text-[#ff3366]' : 'text-[#00ff41]'} >
                      {isBlacklisted ? 'BLACKLISTED' : 'ACTIVE'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isBlacklisted ? 'bg-[#ff3366]' : 'bg-[#00ff41]'} animate-pulse`} />
                  </div>                </div>              </div>            </div>          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] mb-6">
            <StatBox label="CASES_WON" value={agentData.casesWon} color="[#00ff41]" />
            <StatBox label="CASES_LOST" value={agentData.casesLost} color="[#ffcc00]" />
            <StatBox label="WIN_RATE" value={`${winRate}%`} color={winRate > 70 ? "[#00ff41]" : winRate > 40 ? "[#ffcc00]" : "[#ff3366]"} />
            <StatBox label="RISK_SCORE" value={riskScore} color={riskScore > 50 ? "[#ff3366]" : "[#00ff41]"} />          </div>

          {/* No Shows Warning */}
          {agentData.noShows > 0 && (
            <div className="border border-[#ff3366]/30 bg-[#ff3366]/10 p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[#ff3366] text-xl">⚠</span>
                <div>
                  <p className="text-[#ff3366] font-mono text-sm">NO_SHOW_VIOLATIONS: {agentData.noShows}</p>
                  <p className="text-[#666666] text-xs">This agent has failed to respond to court summons.</p>
                </div>              </div>            </div>          )}

          {/* Case History */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#00ff41]">{"//"} CASE_HISTORY</span>
              <div className="flex-1 h-px bg-[#1a1a1a]" />
              <span className="text-[10px] text-[#444444] font-mono">{allCaseAddresses.length} ON-CHAIN</span>
            </div>

            {allCaseAddresses.length > 0 ? (
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="ml-4 text-xs text-[#444444] font-mono">CASE_HISTORY.log</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table min-w-full">
                    <thead>
                      <tr>
                        <th>CASE_CONTRACT</th>
                        <th>ROLE</th>
                        <th>OPPOSITION</th>
                        <th>STAKE</th>
                        <th>OUTCOME</th>
                        <th>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCaseAddresses.map((addr) => (
                        <CaseHistoryRow key={addr} caseAddress={addr} agentAddress={address} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="terminal p-8 text-center">
                <p className="text-[#444444] font-mono">NO_CASE_HISTORY_FOUND</p>
                <p className="text-[#333333] text-sm mt-2">This agent has not participated in any cases yet.</p>
              </div>
            )}
          </div>        </div>      </main>
      
      <Footer />
    </div>
  );
}

function StatBox({ label, value, color = "white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-4">
      <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">{label}</p>
      <p className={`text-2xl font-mono text-${color}`}>{value}</p>
    </div>  );
}
