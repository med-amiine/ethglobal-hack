"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { GoldButton } from "@/app/components/ui/GoldButton";
import { TerminalCard } from "@/app/components/ui/TerminalCard";
import { Navbar } from "@/app/components/Navbar";
import { validateENSName } from "@/lib/ens";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<1 | 2>(1);
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  const isValidName = validateENSName(agentName);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  // Check name availability
  const checkNameAvailability = async (name: string) => {
    if (!validateENSName(name)) {
      setNameAvailable(false);
      return;
    }

    try {
      const res = await fetch(`/api/ens/resolve?name=${name}.jurex.eth`);
      setNameAvailable(res.status === 404); // Available if not found
    } catch {
      setNameAvailable(true);
    }
  };

  const handleNameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setAgentName(cleaned);
    if (cleaned.length >= 3) {
      checkNameAvailability(cleaned);
    } else {
      setNameAvailable(null);
    }
  };

  const [txHash, setTxHash] = useState("");
  const [waitingForSignature, setWaitingForSignature] = useState(false);

  const handleSignTransaction = async () => {
    if (!address || !agentName || !isValidName || !nameAvailable) {
      setError("Please complete all fields");
      return;
    }

    setWaitingForSignature(true);
    setError("");

    try {
      // Get window.ethereum from wallet
      const { ethereum } = window as any;
      if (!ethereum) {
        throw new Error("Wallet not available. Please connect via RainbowKit.");
      }

      // Call selfRegister() - no parameters needed
      // Function selector for selfRegister() = 0xd86a28bb
      const functionSelector = "0xd86a28bb";

      console.log("Calling selfRegister() on CourtRegistry");
      console.log("To contract:", "0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D");

      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: "0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D", // CourtRegistry
            data: functionSelector,
            gas: "0x50000", // ~320k gas for selfRegister
          },
        ],
      });

      console.log("Transaction sent:", txHash);
      setTxHash(txHash);
    } catch (e: any) {
      console.error("Transaction error:", e);
      if (e.code === 4001) {
        setError("Transaction rejected by user");
      } else if (e.message?.includes("User rejected")) {
        setError("Transaction rejected by user");
      } else {
        setError(e.message || "Failed to sign transaction");
      }
    } finally {
      setWaitingForSignature(false);
    }
  };

  const handleRegister = async () => {
    if (!txHash) {
      setError("Please sign transaction first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify transaction on-chain
      const res = await fetch("/api/ens/register-onchain-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName,
          address,
          transactionHash: txHash,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("On-chain verification failed:", data);

        // Fallback: Register locally if on-chain verification fails
        console.log("Falling back to local registration...");
        const fallbackRes = await fetch("/api/ens/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentName,
            address,
            description,
          }),
        });

        if (!fallbackRes.ok) {
          throw new Error(data.error || "Registration failed");
        }

        const fallbackData = await fallbackRes.json();
        setRegisteredName(fallbackData.ensName);
        setSuccess(true);
        return;
      }

      const data = await res.json();
      setRegisteredName(data.ensName);
      setSuccess(true);
    } catch (e: any) {
      console.error("Registration error:", e);
      setError(e.message);
      setTxHash("");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <TerminalCard className="w-full max-w-lg">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#C9A84C] mb-2">
                  Agent Registration
                </h1>
                <p className="text-[#8899AA] text-sm">
                  Connect your wallet to register on jurex.eth
                </p>
              </div>
              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/20 text-sm text-[#8899AA]">
                Please connect your wallet to proceed.
              </div>
            </div>
          </TerminalCard>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <TerminalCard className="w-full max-w-lg">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-[#C9A84C] mb-2">
                  Registration Complete
                </h1>
                <p className="text-[#8899AA] text-sm">
                  Your agent is now discoverable on the network
                </p>
              </div>

              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/30">
                <div className="text-xs text-[#8899AA] mb-2">ENS Name</div>
                <div className="font-mono text-[#C9A84C] font-bold">
                  {registeredName}
                </div>
              </div>

              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/30">
                <div className="text-xs text-[#8899AA] mb-2">Address</div>
                <div className="font-mono text-sm text-white break-all">
                  {address?.slice(0, 10)}...{address?.slice(-8)}
                </div>
              </div>

              <div className="space-y-3">
                {registeredName && (
                  <Link href={`/agent/${registeredName.split(".")[0]}`}>
                    <GoldButton variant="solid" className="w-full">
                      View Your Passport →
                    </GoldButton>
                  </Link>
                )}
                <Link href="/hire">
                  <GoldButton variant="outline" className="w-full">
                    Start Hiring Agents →
                  </GoldButton>
                </Link>
              </div>
            </div>
          </TerminalCard>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-20">
        <TerminalCard className="w-full max-w-lg">
          {step === 1 ? (
            // Step 1: Identity & Wallet
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono text-[#C9A84C] mb-2">
                  STEP 1 / 2
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Choose Your ENS Name
                </h2>
                <p className="text-sm text-[#8899AA] mt-2">
                  3-20 alphanumeric characters
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="giza"
                    className="w-full px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none transition-colors"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    {nameAvailable === true && (
                      <span className="text-xs text-[#4ade80]">
                        ✓ Available
                      </span>
                    )}
                    {nameAvailable === false && (
                      <span className="text-xs text-[#ff3366]">
                        ✗ Not available
                      </span>
                    )}
                    {nameAvailable === null && agentName.length > 0 && (
                      <span className="text-xs text-[#8899AA]">Checking...</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#8899AA] uppercase tracking-wider mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, 200))
                    }
                    placeholder="What does your agent do?"
                    rows={3}
                    className="w-full px-4 py-2 bg-[#050505] border border-[#1A2130] text-white font-mono text-sm rounded-none focus:border-[#C9A84C] focus:outline-none transition-colors"
                  />
                  <div className="text-xs text-[#4A5568] mt-1">
                    {description.length}/200
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0e1a] p-3 border border-[#C9A84C]/20 text-xs text-[#8899AA]">
                Connected: {address?.slice(0, 10)}...{address?.slice(-8)}
              </div>

              {error && (
                <div className="bg-[#ff3366]/10 border border-[#ff3366] p-3 text-sm text-[#ff3366] rounded-none">
                  {error}
                </div>
              )}

              <GoldButton
                variant="solid"
                disabled={!isValidName || !nameAvailable}
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step →
              </GoldButton>
            </div>
          ) : (
            // Step 2: Confirmation
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono text-[#C9A84C] mb-2">
                  STEP 2 / 2
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Review & Register
                </h2>
              </div>

              <div className="space-y-3 bg-[#050505] p-4 border border-[#1A2130]">
                <div>
                  <div className="text-xs text-[#8899AA] mb-1">ENS Name</div>
                  <div className="text-lg font-mono font-bold text-[#C9A84C]">
                    {agentName}.jurex.eth
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#8899AA] mb-1">Wallet</div>
                  <div className="text-sm font-mono text-white break-all">
                    {address}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#8899AA] mb-1">Score</div>
                  <div className="text-lg font-mono font-bold text-[#C9A84C]">
                    500/1000
                  </div>
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="bg-[#0a0e1a] p-4 border border-[#C9A84C]/20 rounded text-xs text-[#8899AA] space-y-2">
                <p className="font-mono font-bold text-[#C9A84C]">🔗 On-Chain Registration</p>
                <p>Contract: CourtRegistry (Base Sepolia)</p>
                <p>Function: registerAgent(address, bytes32)</p>
                {txHash && (
                  <p className="text-[#4ade80]">
                    ✓ Signed: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-[#ff3366]/10 border border-[#ff3366] p-3 text-sm text-[#ff3366] rounded-none">
                  {error}
                </div>
              )}

              <div className="flex gap-3 flex-col">
                {!txHash ? (
                  <GoldButton
                    variant="solid"
                    onClick={handleSignTransaction}
                    disabled={waitingForSignature}
                    className="w-full"
                  >
                    {waitingForSignature ? "Waiting for signature..." : "Sign Transaction →"}
                  </GoldButton>
                ) : (
                  <div className="text-xs text-[#4ade80] text-center p-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded">
                    ✓ Transaction signed. Click Register to complete.
                  </div>
                )}

                <div className="flex gap-3">
                  <GoldButton
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setTxHash("");
                    }}
                    className="flex-1"
                  >
                    ← Back
                  </GoldButton>
                  <GoldButton
                    variant="solid"
                    onClick={handleRegister}
                    disabled={loading || !txHash}
                    className="flex-1"
                  >
                    {loading ? "Registering..." : "Register →"}
                  </GoldButton>
                </div>
              </div>
            </div>
          )}
        </TerminalCard>
      </div>
    </>
  );
}
