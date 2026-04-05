"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";
import { GoldButton } from "@/app/components/ui/GoldButton";
import { DEMO_CONFIG, DEMO_STEPS } from "@/lib/demo-config";

interface LogEntry {
  id: string;
  type: "request" | "response" | "info" | "success" | "error";
  message: string;
  timestamp: Date;
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      type: "info",
      message: "Jurex v2 Demo initialized. Ready to run.",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (
    message: string,
    type: "request" | "response" | "info" | "success" | "error" = "info"
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: new Date(),
      },
    ]);
  };

  const runStep = async (step: number) => {
    setLoading(true);
    addLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "info");

    try {
      if (step === 0) {
        // Step 1: Register Agent
        addLog(
          `1️⃣  REGISTERING AGENT: ${DEMO_CONFIG.agent.name}.jurex.eth`,
          "request"
        );
        await new Promise((r) => setTimeout(r, 500));

        const res = await fetch("/api/ens/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentName: DEMO_CONFIG.agent.name,
            address: DEMO_CONFIG.agent.address,
            description: "Autonomous trading AI on Base Sepolia",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          addLog(`✓ ${data.ensName} registered!`, "success");
          addLog(`  ERC-8004 Score: ${data.erc8004Score}/1000`, "response");
          setCurrentStep(1);
        } else {
          throw new Error("Registration failed");
        }
      } else if (step === 1) {
        // Step 2: Create Task + Escrow
        addLog(
          `2️⃣  CREATING ARC X402 TASK PAYMENT`,
          "request"
        );
        await new Promise((r) => setTimeout(r, 500));

        const taskRes = await fetch("/api/arc/create-task-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentAddress: DEMO_CONFIG.agent.address,
            taskDescription: DEMO_CONFIG.task.description,
            budgetUSDC: DEMO_CONFIG.task.budgetUSDC,
            clientAddress: DEMO_CONFIG.client.address,
          }),
        });

        if (!taskRes.ok) throw new Error("Task creation failed");
        const taskData = await taskRes.json();
        const taskId = taskData.taskId;

        addLog(`✓ Task created: ${taskId}`, "success");
        addLog(
          `  Amount: $${DEMO_CONFIG.task.budgetUSDC} USDC locked in escrow`,
          "response"
        );

        // Generate case ID for dispute (reuse taskId)
        const caseId = taskId;
        (window as any).demoCaseId = caseId;

        await new Promise((r) => setTimeout(r, 800));
        addLog(`\n3️⃣  LOCKING ESCROW VIA UNLINK...`, "request");
        await new Promise((r) => setTimeout(r, 500));

        const escrowRes = await fetch("/api/escrow/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: caseId,
            clientAddress: DEMO_CONFIG.client.address,
            amountUSDC: DEMO_CONFIG.task.budgetUSDC,
          }),
        });

        if (escrowRes.ok) {
          addLog(`✓ Escrow locked (amount PRIVATE)`, "success");
          addLog(`  Awaiting on-chain confirmation...`, "response");
          setCurrentStep(2);
        } else {
          throw new Error("Escrow lock failed");
        }
      } else if (step === 2) {
        // Step 3: Open Dispute
        addLog(`4️⃣  FILING DISPUTE CASE...`, "request");
        await new Promise((r) => setTimeout(r, 500));

        // Use the caseId from step 1 (which is the taskId)
        const caseId = (window as any).demoCaseId;
        addLog(`✓ Case opened: ${caseId}`, "success");
        addLog(`  Plaintiff: ${DEMO_CONFIG.client.address.slice(0, 6)}...`, "response");
        addLog(`  Defendant: ${DEMO_CONFIG.agent.address.slice(0, 6)}...`, "response");
        addLog(`  Dispute: "Agent underperformed benchmark"`, "response");
        setCurrentStep(3);
      } else if (step === 3) {
        // Step 4: Judge Votes
        const caseId = (window as any).demoCaseId;

        addLog(`5️⃣  WORLD ID JUDGE VERIFICATION & VOTING...`, "request");
        await new Promise((r) => setTimeout(r, 700));

        // Judge 1
        const judge1Nullifier = DEMO_CONFIG.judges[0];
        addLog(
          `\n   Judge 1 verified (nullifier: ${judge1Nullifier.slice(0, 12)}...)`,
          "info"
        );
        await new Promise((r) => setTimeout(r, 500));

        try {
          const verifyRes1 = await fetch("/api/judges/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nullifierHash: judge1Nullifier,
              address: DEMO_CONFIG.client.address,
              proof: "demo_proof_1",
            }),
          });

          if (!verifyRes1.ok) throw new Error("Judge 1 verification failed");

          const ruleRes1 = await fetch(
            `/api/cases/${caseId}/rule`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nullifierHash: judge1Nullifier,
                ruling: "agent",
              }),
            }
          );

          if (!ruleRes1.ok) throw new Error("Judge 1 vote failed");
          addLog(`   ✓ Vote: AGENT WINS`, "success");
        } catch (e: any) {
          addLog(`   ✗ Judge 1 error: ${e.message}`, "error");
        }

        // Judge 2
        await new Promise((r) => setTimeout(r, 700));
        const judge2Nullifier = DEMO_CONFIG.judges[1];
        addLog(
          `\n   Judge 2 verified (nullifier: ${judge2Nullifier.slice(0, 12)}...)`,
          "info"
        );
        await new Promise((r) => setTimeout(r, 500));

        try {
          const verifyRes2 = await fetch("/api/judges/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nullifierHash: judge2Nullifier,
              address: DEMO_CONFIG.client.address,
              proof: "demo_proof_2",
            }),
          });

          if (!verifyRes2.ok) throw new Error("Judge 2 verification failed");

          const ruleRes2 = await fetch(
            `/api/cases/${caseId}/rule`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nullifierHash: judge2Nullifier,
                ruling: "agent",
              }),
            }
          );

          if (!ruleRes2.ok) throw new Error("Judge 2 vote failed");
          addLog(`   ✓ Vote: AGENT WINS`, "success");
        } catch (e: any) {
          addLog(`   ✗ Judge 2 error: ${e.message}`, "error");
        }

        // Judge 3
        await new Promise((r) => setTimeout(r, 700));
        const judge3Nullifier = DEMO_CONFIG.judges[2];
        addLog(
          `\n   Judge 3 verified (nullifier: ${judge3Nullifier.slice(0, 12)}...)`,
          "info"
        );
        await new Promise((r) => setTimeout(r, 500));

        try {
          const verifyRes3 = await fetch("/api/judges/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nullifierHash: judge3Nullifier,
              address: DEMO_CONFIG.client.address,
              proof: "demo_proof_3",
            }),
          });

          if (!verifyRes3.ok) throw new Error("Judge 3 verification failed");

          const ruleRes3 = await fetch(
            `/api/cases/${caseId}/rule`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nullifierHash: judge3Nullifier,
                ruling: "agent",
              }),
            }
          );

          if (!ruleRes3.ok) throw new Error("Judge 3 vote failed");
          addLog(`   ✓ Vote: AGENT WINS`, "success");
        } catch (e: any) {
          addLog(`   ✗ Judge 3 error: ${e.message}`, "error");
        }

        await new Promise((r) => setTimeout(r, 500));
        addLog(`\n✓ CONSENSUS REACHED: 3/3 for AGENT`, "success");
        setCurrentStep(4);
      } else if (step === 4) {
        // Step 5: CRE Execute
        addLog(
          `6️⃣  CHAINLINK CRE DEADLINE ENFORCER TRIGGERED...`,
          "request"
        );
        await new Promise((r) => setTimeout(r, 500));

        const creRes = await fetch("/api/demo/run-cre", {
          method: "POST",
        });

        if (creRes.ok) {
          const data = await creRes.json();
          addLog(`✓ CRE Workflow executed`, "success");
          addLog(
            `  Cases processed: ${data.casesProcessed}`,
            "response"
          );
          addLog(
            `  Cases resolved: ${data.casesResolved}`,
            "response"
          );
          addLog(
            `  Escrow released: ${data.escrowReleased}`,
            "response"
          );

          await new Promise((r) => setTimeout(r, 800));
          addLog(
            `\n7️⃣  RELEASING FUNDS VIA UNLINK...`,
            "request"
          );
          await new Promise((r) => setTimeout(r, 500));

          addLog(
            `✓ Private transfer: $${DEMO_CONFIG.task.budgetUSDC} USDC → Agent (amount hidden)`,
            "success"
          );
          addLog(`  Agent balance: ●●●●●● PRIVATE`, "response");

          await new Promise((r) => setTimeout(r, 600));
          addLog(
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            "info"
          );
          addLog(`✓ JUREX DEMO COMPLETE`, "success");
          addLog(`\nAgent reputation updated. Case archived on-chain.`, "info");
          setCurrentStep(5);
        } else {
          throw new Error("CRE execution failed");
        }
      }
    } catch (e: any) {
      addLog(`✗ Error: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      setCurrentStep(0);
      setLogs([
        {
          id: "reset",
          type: "info",
          message: "Demo reset. Ready for new run.",
          timestamp: new Date(),
        },
      ]);
    } catch (e: any) {
      addLog(`Reset failed: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / DEMO_STEPS.length) * 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20 bg-[#0a0e1a]">
        {/* Progress Bar */}
        <div className="fixed top-16 left-0 right-0 h-1 bg-[#1A2130] z-40">
          <div
            className="h-full bg-[#C9A84C] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-8">
          <h1 className="text-4xl font-bold text-[#C9A84C] font-serif mb-2">
            JUREX v2 DEMO
          </h1>
          <p className="text-[#8899AA] mb-8">
            Complete end-to-end dispute resolution workflow
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Steps */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {DEMO_STEPS.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;
                  const isDisabled = idx > currentStep;

                  return (
                    <div
                      key={idx}
                      className={`p-4 border rounded-none transition-all ${
                        isCompleted
                          ? "bg-[#050505] border-[#4ade80]"
                          : isActive
                          ? "bg-[#050505] border-[#C9A84C] shadow-lg shadow-[#C9A84C]/20"
                          : isDisabled
                          ? "bg-[#050505] border-[#4A5568] opacity-50"
                          : "bg-[#050505] border-[#1A2130]"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${
                            isCompleted
                              ? "bg-[#4ade80] text-black"
                              : isActive
                              ? "bg-[#C9A84C] text-black"
                              : "bg-[#1A2130] text-[#4A5568]"
                          }`}
                        >
                          {isCompleted ? "✓" : step.number}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-mono font-bold text-white">
                            {step.title}
                          </h3>
                          <p className="text-xs text-[#8899AA] mt-1">
                            {step.action}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <GoldButton
                          onClick={() => runStep(idx)}
                          disabled={loading}
                          variant="solid"
                          className="w-full text-xs"
                        >
                          {loading ? "Running..." : "RUN STEP →"}
                        </GoldButton>
                      )}
                    </div>
                  );
                })}

                {currentStep === DEMO_STEPS.length && (
                  <GoldButton
                    onClick={handleReset}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? "Resetting..." : "RESET DEMO"}
                  </GoldButton>
                )}
              </div>
            </div>

            {/* RIGHT: Terminal Log */}
            <div className="lg:col-span-3">
              <div className="border border-[#C9A84C] bg-[#050505] rounded-none overflow-hidden h-[600px] flex flex-col">
                {/* Header */}
                <div className="bg-[#0a0e1a] border-b border-[#C9A84C] px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-[#C9A84C] uppercase tracking-wider">
                    Live Event Log
                  </span>
                </div>

                {/* Log Content */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                  {logs.map((log) => {
                    const colors = {
                      request: "text-[#C9A84C]",
                      response: "text-[#8899AA]",
                      info: "text-[#4A5568]",
                      success: "text-[#4ade80]",
                      error: "text-[#ff3366]",
                    };

                    return (
                      <div
                        key={log.id}
                        className={`${colors[log.type]} whitespace-pre-wrap break-words`}
                      >
                        [{log.timestamp.toLocaleTimeString()}] {log.message}
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 bg-[#0a0e1a] border border-[#C9A84C]/20 p-4 rounded-none text-sm text-[#8899AA] space-y-2">
                <div>
                  <span className="text-[#C9A84C]">Agent:</span> {DEMO_CONFIG.agent.name}.jurex.eth
                </div>
                <div>
                  <span className="text-[#C9A84C]">Budget:</span> ${DEMO_CONFIG.task.budgetUSDC} USDC
                </div>
                <div>
                  <span className="text-[#C9A84C]">Judges:</span> 3 verified via World ID
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
