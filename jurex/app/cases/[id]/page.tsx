"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { FileUpload } from "../../components/FileUpload";
import { useCaseDetails, useRespondToCase, useSubmitEvidence, useMissedDeadline, useResolveAfterDeadline, useAppealInfo, useFileAppeal, useAssignJudgesToCase, useSubmitVote } from "@/lib/contract-hooks";
import { useCaseUpdates } from "@/lib/ably-hooks";
import { useState } from "react";

const statusConfig: Record<number, { dot: string; label: string; color: string }> = {
  0: { dot: "bg-[#ffcc00] animate-pulse", label: "FILED_AWAITING_RESPONSE", color: "[#ffcc00]" },
  1: { dot: "bg-[#ffcc00] animate-pulse", label: "SUMMONED", color: "[#ffcc00]" },
  2: { dot: "bg-[#00ff41]", label: "ACTIVE", color: "[#00ff41]" },
  3: { dot: "bg-[#00ff41] animate-pulse", label: "DELIBERATING", color: "[#00ff41]" },
  4: { dot: "bg-[#666666]", label: "RESOLVED", color: "[#666666]" },
  5: { dot: "bg-[#444444]", label: "DISMISSED", color: "[#444444]" },
  6: { dot: "bg-[#ff3366]", label: "DEFAULTED", color: "[#ff3366]" },
  7: { dot: "bg-[#ffcc00] animate-pulse", label: "APPEALED", color: "[#ffcc00]" },
};

export default function CaseDetailPage() {
  const params = useParams();
  const { address: userAddress } = useAccount();
  const caseAddress = params.id as string;
  
  const [evidenceHash, setEvidenceHash] = useState("");
  
  // Ably real-time updates
  const { messages, connectionState } = useCaseUpdates(caseAddress);
  
  // Read case data from contract
  const {
    plaintiff,
    defendant,
    state,
    plaintiffStake,
    defendantStake,
    claimDescription,
    deadline,
    filedAt,
    plaintiffWins,
    judges,
    voteCount,
    isLoading,
  } = useCaseDetails(caseAddress);

  // Write functions
  const { respond, isPending: isResponding } = useRespondToCase();
  const { submit, isPending: isSubmittingEvidence } = useSubmitEvidence();
  const { trigger: triggerDefault, isPending: isTriggeringDefault } = useMissedDeadline();
  const { appealUsed, verdictRenderedAt } = useAppealInfo(caseAddress);
  const { fileAppeal, isPending: isAppealing } = useFileAppeal();
  const { assignJudges, isPending: isAssigningJudges } = useAssignJudgesToCase();
  const { vote, isPending: isVoting } = useSubmitVote();

  const caseState = state.data !== undefined ? Number(state.data) : 0;
  const status = statusConfig[caseState] || statusConfig[0];
  
  const pStake = plaintiffStake.data ? formatEther(plaintiffStake.data as bigint) : "0";
  const dStake = defendantStake.data ? formatEther(defendantStake.data as bigint) : "0";
  const totalStake = (parseFloat(pStake) + parseFloat(dStake)).toFixed(4);
  
  const isDefendant = userAddress?.toLowerCase() === (defendant.data as string)?.toLowerCase();
  const isPlaintiff = userAddress?.toLowerCase() === (plaintiff.data as string)?.toLowerCase();
  const judgeList = (judges.data as string[]) || [];
  const isJudge = userAddress ? judgeList.map(j => j.toLowerCase()).includes(userAddress.toLowerCase()) : false;

  const nowSec = Math.floor(Date.now() / 1000);
  const deadlineSec = deadline.data ? Number(deadline.data) : 0;

  const canRespond = caseState === 1 && isDefendant; // SUMMONED state
  const canSubmitEvidence = caseState === 2; // ACTIVE only — contract rejects other states
  const canTriggerDefault = caseState === 1 && deadlineSec > 0 && nowSec > deadlineSec; // SUMMONED + deadline passed

  // Assign judges: Active (2) or Appealed (7); factory requires Active or Appealed state
  const judgesAssigned = judgeList.length > 0;
  const canAssignJudges = (caseState === 2 || caseState === 7) && !judgesAssigned;

  // Deliberation timeout: DELIBERATING (3) + 30 min (1800s) passed since judges assigned
  // We use filedAt + buffer as proxy (contract uses internal timestamp); show button and let contract decide
  const canResolveTimeout = caseState === 3;

  // Voting: DELIBERATING (3) or APPEALED (7) + is assigned judge
  const canVote = (caseState === 3 || caseState === 7) && isJudge;

  // Appeal: only resolved (state 4), losing party, within 10-min window, not already used
  const APPEAL_WINDOW_SEC = 600; // 10 minutes
  const verdictTimeSec = verdictRenderedAt.data ? Number(verdictRenderedAt.data) : 0;
  const appealWindowOpen = verdictTimeSec > 0 && nowSec <= verdictTimeSec + APPEAL_WINDOW_SEC;
  const isLosingPlaintiff = caseState === 4 && isPlaintiff && plaintiffWins.data === false;
  const isLosingDefendant = caseState === 4 && isDefendant && plaintiffWins.data === true;
  const canAppeal = (isLosingPlaintiff || isLosingDefendant) && appealWindowOpen && !appealUsed.data;
  const appealSecondsLeft = verdictTimeSec > 0 ? Math.max(0, verdictTimeSec + APPEAL_WINDOW_SEC - nowSec) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="terminal p-12 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-[#00ff41] animate-pulse" />
                <span className="font-mono text-[#444444]">LOADING_CASE_DATA...</span>
              </div>            </div>          </div>        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <Link href="/cases" className="hover:text-[#00ff41]">CASES</Link>
            <span>/</span>
            <span className="text-white">{caseAddress.slice(0, 8)}...{caseAddress.slice(-6)}</span>
          </nav>

          <div className="terminal mb-6">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">CASE_DETAILS.sys</span>
              <span className="ml-auto text-[10px] text-[#333333]">READ-ONLY</span>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#444444] font-mono mb-2">CASE_CONTRACT: {caseAddress.slice(0, 20)}...{caseAddress.slice(-8)}</p>
                  <h1 className="text-2xl md:text-3xl font-mono text-white break-all">
                    {(claimDescription.data as string) || "Case loading..."}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-xs font-mono text-${status.color}`}>{status.label}</span>
                </div>              </div>

              <div className="grid grid-cols-3 gap-px bg-[#1a1a1a]">
                <div className="bg-[#0a0a0a] p-4">
                  <p className="text-[10px] text-[#444444] font-mono mb-1">PLAINTIFF_STAKE</p>
                  <p className="text-xl font-mono text-white">{pStake} ETH</p>
                </div>
                <div className="bg-[#0a0a0a] p-4">
                  <p className="text-[10px] text-[#444444] font-mono mb-1">DEFENDANT_STAKE</p>
                  <p className="text-xl font-mono text-white">{dStake} ETH</p>
                </div>
                <div className="bg-[#0a0a0a] p-4">
                  <p className="text-[10px] text-[#444444] font-mono mb-1">TOTAL_AT_STAKE</p>
                  <p className="text-xl font-mono text-[#00ff41]">{totalStake} ETH</p>
                </div>              </div>            </div>          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="data-card group">
              <p className="text-[10px] text-[#444444] font-mono mb-4">PLAINTIFF (CLAIMANT)</p>
              <p className="font-mono text-white mb-2 break-all">{(plaintiff.data as string) || "Loading..."}</p>
              <Link 
                href={`/agents/${plaintiff.data}`} 
                className="text-[10px] text-[#444444] hover:text-[#00ff41] font-mono transition-colors"
              >
                VIEW_PROFILE →
              </Link>
            </div>

            <div className="data-card group">
              <p className="text-[10px] text-[#444444] font-mono mb-4">DEFENDANT (RESPONDENT)</p>
              <p className="font-mono text-white mb-2 break-all">{(defendant.data as string) || "Loading..."}</p>
              <Link 
                href={`/agents/${defendant.data}`} 
                className="text-[10px] text-[#444444] hover:text-[#00ff41] font-mono transition-colors"
              >
                VIEW_PROFILE →
              </Link>            </div>          </div>

          {/* Action Buttons for Connected Wallet */}
          {(isDefendant || isPlaintiff || isJudge || canAssignJudges || canTriggerDefault || canResolveTimeout) && (
            <div className="terminal mb-6">
              <div className="terminal-header">
                <span className="text-xs text-[#444444] font-mono">AVAILABLE_ACTIONS.exe</span>
                {isJudge && <span className="ml-auto text-[10px] text-[#00ff41] font-mono">YOU_ARE_JUDGE</span>}
              </div>

              <div className="p-4 space-y-4">
                {/* Respond to Case */}
                {canRespond && (
                  <button
                    onClick={() => respond(caseAddress)}
                    disabled={isResponding}
                    className="w-full px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50"
                  >
                    {isResponding ? "CONFIRMING..." : "RESPOND_TO_CASE (STAKE 0.0001 ETH)"}
                  </button>
                )}

                {/* Submit Evidence */}
                {canSubmitEvidence && (isPlaintiff || isDefendant) && (
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase text-[#444444] font-mono">Upload Evidence to IPFS</p>
                    <FileUpload
                      onUploadComplete={(hash) => setEvidenceHash(hash)}
                      onError={(err) => console.error("Upload failed:", err)}
                      acceptedTypes=".pdf,.png,.jpg,.jpeg,.mp4,.txt,.md,.json"
                      maxSizeMB={10}
                    />
                    {evidenceHash && (
                      <div className="p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                        <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">IPFS_HASH_READY</p>
                        <p className="text-xs font-mono text-white break-all">{evidenceHash}</p>
                      </div>
                    )}
                    <button
                      onClick={() => submit(caseAddress, evidenceHash)}
                      disabled={isSubmittingEvidence || !evidenceHash}
                      className="w-full px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingEvidence ? "SUBMITTING..." : "SUBMIT_EVIDENCE"}
                    </button>
                  </div>
                )}

                {/* Assign Judges (anyone can call — acts as keeper) */}
                {canAssignJudges && (
                  <div className="space-y-2">
                    <div className="p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                      <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">READY_FOR_JUDGE_ASSIGNMENT</p>
                      <p className="text-xs font-mono text-[#888888]">
                        {caseState === 7 ? "Appeal round — 5 judges randomly selected from JRX staker pool" : "Randomly selects 3 judges from the JRX staker pool"}
                      </p>
                    </div>
                    <button
                      onClick={() => assignJudges(caseAddress)}
                      disabled={isAssigningJudges}
                      className="w-full px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50"
                    >
                      {isAssigningJudges ? "ASSIGNING..." : caseState === 7 ? "ASSIGN_APPEAL_JUDGES (5)" : "ASSIGN_JUDGES (RANDOM)"}
                    </button>
                  </div>
                )}

                {/* Vote — judges only, DELIBERATING or APPEALED state */}
                {canVote && (
                  <div className="space-y-2">
                    <div className="p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                      <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">CAST_YOUR_VOTE</p>
                      <p className="text-xs font-mono text-[#888888]">
                        {caseState === 7 ? "Appeal round — 3/5 majority required" : "2/3 majority required to reach verdict"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => vote(caseAddress, true)}
                        disabled={isVoting}
                        className="px-4 py-3 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41]/10 transition-colors disabled:opacity-50"
                      >
                        {isVoting ? "VOTING..." : "PLAINTIFF_WINS"}
                      </button>
                      <button
                        onClick={() => vote(caseAddress, false)}
                        disabled={isVoting}
                        className="px-4 py-3 border border-[#ff3366] text-[#ff3366] font-mono text-sm hover:bg-[#ff3366]/10 transition-colors disabled:opacity-50"
                      >
                        {isVoting ? "VOTING..." : "DEFENDANT_WINS"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Trigger Default — deadline passed, defendant no-show */}
                {canTriggerDefault && (
                  <button
                    onClick={() => triggerDefault(caseAddress)}
                    disabled={isTriggeringDefault}
                    className="w-full px-4 py-3 border border-[#ff3366] text-[#ff3366] font-mono text-sm hover:bg-[#ff3366]/10 transition-colors disabled:opacity-50"
                  >
                    {isTriggeringDefault ? "PROCESSING..." : "CLAIM_DEFAULT_JUDGMENT (DEADLINE_PASSED)"}
                  </button>
                )}

                {/* Resolve Deliberation Timeout — 30 min no verdict */}
                {canResolveTimeout && (
                  <ResolveTimeoutButton caseAddress={caseAddress} />
                )}

                {/* Appeal */}
                {canAppeal && (
                  <div className="space-y-2">
                    <div className="p-3 border border-[#ffcc00]/30 bg-[#ffcc00]/5">
                      <p className="text-[10px] uppercase text-[#ffcc00] font-mono mb-1">APPEAL_WINDOW_OPEN</p>
                      <p className="text-xs font-mono text-[#888888]">
                        {Math.floor(appealSecondsLeft / 60)}m {appealSecondsLeft % 60}s remaining · Bond: 0.0003 ETH
                      </p>
                    </div>
                    <button
                      onClick={() => fileAppeal(caseAddress)}
                      disabled={isAppealing}
                      className="w-full px-4 py-3 border border-[#ffcc00] text-[#ffcc00] font-mono text-sm hover:bg-[#ffcc00]/10 transition-colors disabled:opacity-50"
                    >
                      {isAppealing ? "FILING_APPEAL..." : "FILE_APPEAL (BOND: 0.0003 ETH)"}
                    </button>
                  </div>
                )}

                {!canRespond && !canSubmitEvidence && !canTriggerDefault && !canAppeal && !canAssignJudges && !canVote && !canResolveTimeout && (
                  <p className="text-[#444444] font-mono text-sm text-center py-4">NO_ACTIONS_AVAILABLE_FOR_CURRENT_STATE</p>
                )}
              </div>
            </div>
          )}

          {/* Verdict Banner */}
          {(caseState === 4 || caseState === 6) && plaintiffWins.data !== undefined && (
            <div className={`border p-6 mb-6 text-center ${plaintiffWins.data ? "border-[#00ff41]/40 bg-[#00ff41]/5" : "border-[#ff3366]/40 bg-[#ff3366]/5"}`}>
              <p className="text-[10px] uppercase text-[#444444] font-mono mb-2">FINAL_VERDICT</p>
              <p className={`text-2xl font-mono ${plaintiffWins.data ? "text-[#00ff41]" : "text-[#ff3366]"}`}>
                {plaintiffWins.data ? "PLAINTIFF_WINS" : "DEFENDANT_WINS"}
              </p>
              <p className="text-xs text-[#666666] font-mono mt-2">
                {caseState === 6 ? "Default judgment — defendant did not respond" : "Majority verdict by assigned judges"}
              </p>
              {isPlaintiff || isDefendant ? (
                <p className="text-xs font-mono mt-3">
                  {(isPlaintiff && plaintiffWins.data) || (isDefendant && !plaintiffWins.data)
                    ? <span className="text-[#00ff41]">You won this case. Stakes distributed to your address.</span>
                    : <span className="text-[#ff3366]">You lost this case. Stake forfeited.</span>
                  }
                </p>
              ) : null}
            </div>
          )}

          {/* Deliberating Panel — judges + live vote counts (DELIBERATING=3 or APPEALED=7 with judges) */}
          {(caseState === 3 || (caseState === 7 && judgesAssigned)) && (
            <div className="terminal mb-6">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="ml-4 text-xs text-[#444444] font-mono">
                  {caseState === 7 ? "APPEAL_DELIBERATION.live" : "DELIBERATION.live"}
                </span>
                <span className="ml-auto text-[10px] text-[#00ff41] animate-pulse">LIVE</span>
              </div>
              <div className="p-6">
                {/* Vote tally */}
                <div className="grid grid-cols-2 gap-px bg-[#1a1a1a] mb-6">
                  <div className="bg-[#0a0a0a] p-4 text-center">
                    <p className="text-[10px] text-[#444444] font-mono mb-1">PLAINTIFF_VOTES</p>
                    <p className="text-3xl font-mono text-[#00ff41]">
                      {voteCount.data ? String((voteCount.data as [bigint, bigint])[0]) : "0"}
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 text-center">
                    <p className="text-[10px] text-[#444444] font-mono mb-1">DEFENDANT_VOTES</p>
                    <p className="text-3xl font-mono text-[#ff3366]">
                      {voteCount.data ? String((voteCount.data as [bigint, bigint])[1]) : "0"}
                    </p>
                  </div>
                </div>
                {/* Judges list */}
                <p className="text-[10px] text-[#444444] font-mono mb-3">ASSIGNED_JUDGES</p>
                <div className="space-y-2">
                  {((judges.data as string[]) || []).length === 0 ? (
                    <p className="text-[#666666] font-mono text-sm">No judges assigned yet</p>
                  ) : (
                    ((judges.data as string[]) || []).map((judge, i) => (
                      <div key={judge} className="flex items-center gap-3 p-2 border border-[#1a1a1a]">
                        <span className="text-[10px] font-mono text-[#444444]">JUDGE_{i + 1}</span>
                        <span className="font-mono text-white text-sm break-all">{judge}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">CASE_TIMELINE.log</span>
            </div>            
            <div className="p-6">
              <div className="space-y-0">
                <TimelineItem 
                  step="01" 
                  title="CASE_FILED" 
                  description={`Plaintiff filed case with ${pStake} ETH stake`} 
                  complete={caseState >= 0} 
                  active={caseState === 0}
                />
                <TimelineItem 
                  step="02" 
                  title="DEFENDANT_SUMMONED" 
                  description="Defendant has 24 hours to respond with matching stake" 
                  complete={caseState >= 1} 
                  active={caseState === 1}
                />
                <TimelineItem 
                  step="03" 
                  title="CASE_ACTIVE" 
                  description="Evidence submission period open" 
                  complete={caseState >= 2} 
                  active={caseState === 2}
                />
                <TimelineItem 
                  step="04" 
                  title="DELIBERATION" 
                  description="Validator agents reviewing evidence" 
                  complete={caseState >= 3} 
                  active={caseState === 3}
                />
                <TimelineItem 
                  step="05" 
                  title="VERDICT" 
                  description={plaintiffWins.data !== undefined ? `Verdict: ${plaintiffWins.data ? 'Plaintiff Wins' : 'Defendant Wins'}` : "Final verdict recorded on-chain"} 
                  complete={caseState >= 4} 
                  active={caseState === 4}
                />
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="terminal mt-6">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">LIVE_ACTIVITY.stream</span>
              <span className={`ml-auto text-[10px] ${connectionState === 'connected' ? 'text-[#00ff41]' : 'text-[#ffcc00]'}`}>
                {connectionState.toUpperCase()}
              </span>
            </div>
            
            <div className="p-4 max-h-48 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-[#444444] font-mono text-sm text-center py-4">
                  Waiting for real-time updates...
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.slice().reverse().map((msg, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm font-mono">
                      <span className="text-[#00ff41]">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-[#666666]">{msg.name}:</span>
                      <span className="text-white">{JSON.stringify(msg.data).slice(0, 100)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function ResolveTimeoutButton({ caseAddress }: { caseAddress: string }) {
  const { resolve, isPending } = useResolveAfterDeadline();
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    setError(null);
    try {
      await resolve(caseAddress);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Surface a helpful message — contract will revert if timeout not reached yet
      if (msg.includes("Timeout not reached")) {
        setError("30-minute deliberation timeout has not passed yet.");
      } else {
        setError(msg.slice(0, 120));
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="p-3 border border-[#ffcc00]/30 bg-[#ffcc00]/5">
        <p className="text-[10px] uppercase text-[#ffcc00] font-mono mb-1">DELIBERATION_TIMEOUT</p>
        <p className="text-xs font-mono text-[#888888]">
          If judges fail to reach a verdict within 30 min, the case can be dismissed and stakes refunded.
        </p>
      </div>
      {error && <p className="text-xs text-[#ff3366] font-mono">{error}</p>}
      <button
        onClick={handleResolve}
        disabled={isPending}
        className="w-full px-4 py-3 border border-[#ffcc00] text-[#ffcc00] font-mono text-sm hover:bg-[#ffcc00]/10 transition-colors disabled:opacity-50"
      >
        {isPending ? "RESOLVING..." : "RESOLVE_DELIBERATION_TIMEOUT"}
      </button>
    </div>
  );
}

function TimelineItem({
  step,
  title,
  description,
  complete,
  active
}: { 
  step: string; 
  title: string; 
  description: string; 
  complete: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className={`w-8 h-8 flex items-center justify-center text-xs font-mono flex-shrink-0 ${
        complete ? "bg-[#00ff41] text-black" : active ? "border border-[#00ff41] text-[#00ff41]" : "border border-[#1a1a1a] text-[#444444]"
      }`}>
        {complete ? "✓" : step}
      </div>
      <div className={`pb-8 border-l border-[#1a1a1a] ml-4 pl-4 -translate-x-4 ${complete || active ? "" : "opacity-50"}`}>
        <p className={`font-mono text-sm ${complete || active ? "text-white" : "text-[#444444]"}`}>{title}</p>
        <p className="text-sm text-[#666666]">{description}</p>
      </div>    </div>
  );
}
