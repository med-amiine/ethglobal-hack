"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { FileUpload } from "../components/FileUpload";
import { useFileCase, useBaseFee, useIsBlacklisted, formatEth } from "@/lib/contract-hooks";

const categories = [
  { value: "PAYMENT_DISPUTE", label: "PAYMENT_DISPUTE" },
  { value: "SERVICE_FAILURE", label: "SERVICE_FAILURE" },
  { value: "CONTRACT_BREACH", label: "CONTRACT_BREACH" },
  { value: "DATA_INTEGRITY", label: "DATA_INTEGRITY" },
  { value: "OTHER", label: "OTHER" },
];

export default function FileCasePage() {
  const { address, isConnected } = useAccount();
  const { data: baseFee } = useBaseFee();
  const { data: isBlacklisted } = useIsBlacklisted(address);
  const { fileCase, isPending, error } = useFileCase();

  const [defendant, setDefendant] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isSelfSue = !!address && !!defendant && defendant.toLowerCase() === address.toLowerCase();
  const isValidAddress = !defendant || (defendant.startsWith("0x") && defendant.length === 42);
  const formError = isSelfSue ? "Cannot file a case against yourself" : !isValidAddress ? "Invalid Ethereum address" : null;

  const requiredStake = baseFee ? (baseFee as bigint) * BigInt(2) : BigInt(0);

  const handleUploadComplete = (ipfsHash: string, gatewayUrl: string) => {
    setEvidenceHash(ipfsHash);
    setEvidenceUrl(gatewayUrl);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setEvidenceHash("");
    setEvidenceUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defendant || !description) return;

    try {
      const tx = await fileCase(defendant, description, evidenceHash || "QmDefaultEvidence");
      setTxHash(tx);
    } catch (err) {
      console.error("Failed to file case:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-6">
            <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
              <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
              <span>/</span>
              <span className="text-white">FILE_CASE</span>
            </nav>

            <div className="terminal p-12 text-center">
              <span className="text-[10px] uppercase text-[#444444] font-mono">WALLET_REQUIRED</span>
              <h1 className="text-2xl font-mono text-white mt-4 mb-4">CONNECT_WALLET</h1>
              <p className="text-[#666666] font-mono text-sm mb-8">Connect your wallet to file a dispute case</p>
              <div className="text-[#444444] font-mono text-xs">Waiting for wallet connection...</div>
            </div>          </div>        </main>
        
        <Footer />
      </div>
    );
  }

  if (isBlacklisted) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="border border-[#ff3366]/50 bg-[#ff3366]/10 p-8 text-center">
              <span className="text-[#ff3366] text-4xl mb-4 block">⚠</span>
              <h1 className="text-2xl font-mono text-[#ff3366] mb-4">ACCOUNT_BLACKLISTED</h1>
              <p className="text-[#888888] font-mono text-sm">Your account has been blacklisted and cannot file cases.</p>
            </div>          </div>        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <span className="text-white">FILE_CASE</span>
          </nav>

          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">INITIATE_DISPUTE</span>
            <h1 className="text-3xl md:text-4xl font-mono text-white mt-2 mb-4">FILE_A_CASE</h1>
            <p className="text-[#666666] font-mono text-sm">
              Submit a dispute for review by the Jurex Network. Requires 2x base fee stake.
            </p>
          </div>

          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-4 text-xs text-[#444444] font-mono">case_filing.exe</span>
            </div>

            <div className="p-6 md:p-8">
              {txHash ? (
                <div className="text-center py-8">
                  <span className="text-[#00ff41] text-4xl mb-4 block">✓</span>
                  <h2 className="text-xl font-mono text-white mb-4">CASE_FILED</h2>
                  <p className="text-[#888888] font-mono text-sm mb-4">Your case has been submitted to the court.</p>
                  <Link
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    className="text-[#00ff41] font-mono text-sm hover:underline"
                  >
                    View on Arbiscan →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Plaintiff — connected wallet */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">
                      You (PLAINTIFF)
                    </label>
                    <div className="w-full bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-3 font-mono text-sm text-[#00ff41]">
                      {address}
                    </div>
                    <p className="text-xs text-[#444444] font-mono mt-2">Your connected wallet — you are the claimant</p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">
                      Defendant Address *
                    </label>
                    <input
                      type="text"
                      value={defendant}
                      onChange={(e) => setDefendant(e.target.value)}
                      placeholder="0x..."
                      className={`w-full bg-[#050505] border px-4 py-3 text-white font-mono text-sm focus:outline-none transition-colors ${
                        formError ? "border-[#ff3366] focus:border-[#ff3366]" : "border-[#1a1a1a] focus:border-[#00ff41]"
                      }`}
                    />
                    {formError && (
                      <p className="text-xs text-[#ff3366] font-mono mt-2">⚠ {formError}</p>
                    )}
                    {!formError && <p className="text-xs text-[#444444] font-mono mt-2">The Ethereum address of the agent you are filing against</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">
                      Dispute Category *
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#050505] border border-[#1a1a1a] px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41] transition-colors"
                    >
                      <option value="">SELECT_CATEGORY...</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">
                      Case Description *
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the nature of the dispute..."
                      className="w-full bg-[#050505] border border-[#1a1a1a] px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">
                      Evidence Upload
                    </label>
                    
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      onError={handleUploadError}
                      acceptedTypes=".pdf,.png,.jpg,.jpeg,.mp4,.txt,.md,.json"
                      maxSizeMB={10}
                    />
                    
                    {uploadError && (
                      <p className="text-xs text-[#ff3366] font-mono mt-2">{uploadError}</p>
                    )}
                    
                    {evidenceHash && (
                      <div className="mt-4 p-3 border border-[#00ff41]/30 bg-[#00ff41]/5">
                        <p className="text-[10px] uppercase text-[#00ff41] font-mono mb-1">IPFS_HASH_UPLOADED</p>
                        <p className="text-xs font-mono text-white break-all">{evidenceHash}</p>
                        <a 
                          href={evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00ff41] hover:underline mt-2 inline-block"
                        >
                          View on IPFS →
                        </a>
                      </div>
                    )}
                    
                    {!evidenceHash && (
                      <p className="text-xs text-[#444444] font-mono mt-2">
                        Upload evidence to IPFS via Pinata (optional but recommended)
                      </p>
                    )}
                  </div>

                  <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase text-[#444444] font-mono">Required Stake</span>
                      <span className="text-white font-mono">{formatEth(requiredStake)}</span>
                    </div>
                    <ul className="space-y-2 text-sm text-[#666666] font-mono">
                      <li className="flex items-start gap-2">
                        <span className="text-[#00ff41]">▸</span>
                        <span>2x base fee required as stake</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#00ff41]">▸</span>
                        <span>Case reviewed by 3 validator agents</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#00ff41]">▸</span>
                        <span>Losing party forfeits stake portion</span>
                      </li>
                    </ul>
                  </div>

                  {error && (
                    <div className="border border-[#ff3366]/30 bg-[#ff3366]/10 p-4">
                      <p className="text-[#ff3366] font-mono text-sm">⚠ {error.message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !defendant || !description || !!formError}
                    className="w-full px-6 py-4 border border-[#00ff41] text-[#00ff41] font-mono text-sm hover:bg-[#00ff41] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "CONFIRMING_TRANSACTION..." : `STAKE_${formatEth(requiredStake)}_&_FILE_CASE →`}
                  </button>

                  <p className="text-xs text-[#444444] font-mono text-center">
                    By filing, you agree to abide by the court&apos;s verdict. 
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </form>
              )}
            </div>          </div>        </div>      </main>
      
      <Footer />
    </div>
  );
}
