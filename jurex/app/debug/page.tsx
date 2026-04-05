"use client";

import { useAccount } from "wagmi";
import { createPublicClient, http, isAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { TerminalCard } from "@/app/components/ui/TerminalCard";

export default function DebugPage() {
  const { address } = useAccount();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkContract = async () => {
    setChecking(true);
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      const COURT_REGISTRY = "0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D";

      // Check if contract exists
      const code = await publicClient.getCode({
        address: COURT_REGISTRY as `0x${string}`,
      });

      // Get block number
      const blockNumber = await publicClient.getBlockNumber();

      setResults({
        network: "Base Sepolia (84532)",
        rpc: "https://sepolia.base.org",
        blockNumber: blockNumber.toString(),
        courtRegistry: COURT_REGISTRY,
        contractExists: code !== "0x",
        codeLength: code.length,
        walletAddress: address,
        walletValid: address ? isAddress(address) : false,
      });
    } catch (e: any) {
      setResults({
        error: e.message,
        errorDetails: e.toString(),
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-[#C9A84C] mb-8 font-serif">
            Debug Info
          </h1>

          <TerminalCard title="Blockchain Setup">
            <div className="space-y-4">
              <p className="text-[#8899AA] text-sm">
                Check if your wallet and contracts are correctly configured on
                Base Sepolia.
              </p>

              <button
                onClick={checkContract}
                disabled={checking}
                className="w-full px-4 py-2 bg-[#C9A84C] text-black font-mono text-sm font-bold rounded hover:bg-[#a8823a] disabled:opacity-50"
              >
                {checking ? "Checking..." : "Check Setup"}
              </button>

              {results && (
                <div className="bg-[#050505] p-4 rounded border border-[#1A2130] space-y-2 text-xs font-mono text-[#8899AA]">
                  {results.error ? (
                    <>
                      <div className="text-[#ff3366]">❌ Error: {results.error}</div>
                      <div className="text-[#4A5568]">{results.errorDetails}</div>
                    </>
                  ) : (
                    <>
                      <div>
                        Network: <span className="text-white">{results.network}</span>
                      </div>
                      <div>
                        RPC: <span className="text-white text-[10px]">{results.rpc}</span>
                      </div>
                      <div>
                        Block: <span className="text-white">{results.blockNumber}</span>
                      </div>
                      <div className="border-t border-[#1A2130] pt-2 mt-2">
                        CourtRegistry:{" "}
                        <span className="text-white text-[10px]">{results.courtRegistry}</span>
                      </div>
                      <div>
                        Contract exists:{" "}
                        <span
                          className={results.contractExists ? "text-[#4ade80]" : "text-[#ff3366]"}
                        >
                          {results.contractExists ? "✓ YES" : "✗ NO"}
                        </span>
                      </div>
                      <div>
                        Code bytes: <span className="text-white">{results.codeLength}</span>
                      </div>
                      <div className="border-t border-[#1A2130] pt-2 mt-2">
                        Wallet: <span className="text-white text-[10px]">{results.walletAddress}</span>
                      </div>
                      <div>
                        Valid wallet:{" "}
                        <span
                          className={results.walletValid ? "text-[#4ade80]" : "text-[#ff3366]"}
                        >
                          {results.walletValid ? "✓ YES" : "✗ NO"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </TerminalCard>

          <TerminalCard title="What This Checks">
            <ul className="space-y-2 text-sm text-[#8899AA]">
              <li>✓ Can connect to Base Sepolia RPC</li>
              <li>✓ CourtRegistry contract is deployed at correct address</li>
              <li>✓ Your wallet address is valid</li>
              <li>✓ Current block number</li>
            </ul>
          </TerminalCard>

          <TerminalCard title="If Contract Not Found">
            <div className="space-y-3 text-sm text-[#8899AA]">
              <p>
                The contract might not be deployed. You have two options:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Deploy the contract:</strong> Run the deploy script from
                  /contracts directory
                </li>
                <li>
                  <strong>Use mock registration:</strong> Continue with local JSON
                  registration (no blockchain needed)
                </li>
              </ol>

              <div className="bg-[#0a0e1a] p-3 border border-[#C9A84C]/20 rounded mt-4">
                <p className="text-[#C9A84C] font-mono text-xs mb-2">Deploy command:</p>
                <code className="text-[10px] break-all">
                  cd contracts && npx hardhat run scripts/deploy-v2.ts --network baseSepolia
                </code>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Troubleshooting">
            <div className="space-y-3 text-sm text-[#8899AA]">
              <div>
                <strong className="text-white">Transaction reverted:</strong>
                <p>Possible causes:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Contract validation failed</li>
                  <li>Incorrect function parameters</li>
                  <li>Insufficient gas</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#1A2130]">
                <strong className="text-white">Next steps:</strong>
                <ol className="list-decimal list-inside mt-1">
                  <li>Check contract is deployed (use button above)</li>
                  <li>Try registration - system will fall back to local if on-chain fails</li>
                  <li>Use /demo page for quick testing (no blockchain needed)</li>
                </ol>
              </div>
            </div>
          </TerminalCard>
        </div>
      </div>
    </>
  );
}
