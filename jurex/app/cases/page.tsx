"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const categories = ["ALL", "PAYMENT_DISPUTE", "SERVICE_FAILURE", "CONTRACT_BREACH", "DATA_INTEGRITY"];
const PAGE_SIZE = 20;
const statuses = ["ALL", "PENDING", "ACTIVE", "RESOLVED", "APPEALED"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-service-sand.vercel.app";

// Format timestamp to relative time
function formatTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface CaseData {
  address: string;
  state: string;
  plaintiff: string;
  defendant: string;
  plaintiffStake: string;
  defendantStake: string;
  deadlineToRespond: number;
  evidenceIpfsHash: string;
  filedAt: number;
  resolvedAt: number | null;
  outcome: string | null;
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // Fetch cases on mount
  useEffect(() => {
    async function fetchCases() {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/cases`);
        if (response.ok) {
          const data = await response.json();
          if (data.cases && data.cases.length > 0) {
            // Fetch details for each case
            const caseDetails = await Promise.all(
              data.cases.map(async (caseAddr: string) => {
                try {
                  const detailRes = await fetch(`${API_BASE_URL}/cases/${caseAddr}`);
                  if (detailRes.ok) {
                    const detail = await detailRes.json();
                    return detail.case;
                  }
                } catch (e) {
                  console.error(`Failed to fetch case ${caseAddr}:`, e);
                }
                return null;
              })
            );
            setCases(caseDetails.filter(Boolean));
          }
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        setError("API unavailable");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCases();
  }, []);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch = !searchQuery || 
      c.address?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.plaintiff?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.defendant?.toLowerCase().includes(searchQuery.toLowerCase());
    // Category filter: match against claimDescription or state since API doesn't include category field yet
    const matchesCategory = selectedCategory === "ALL" ||
      c.state?.toUpperCase().includes(selectedCategory) ||
      (c as unknown as { claimDescription?: string }).claimDescription?.toUpperCase().includes(selectedCategory);
    const matchesStatus = selectedStatus === "ALL" || c.state?.toUpperCase() === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  // Sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (b.filedAt || 0) - (a.filedAt || 0);
      case "oldest":
        return (a.filedAt || 0) - (b.filedAt || 0);
      case "stake-high":
        return parseFloat(b.plaintiffStake || "0") - parseFloat(a.plaintiffStake || "0");
      case "stake-low":
        return parseFloat(a.plaintiffStake || "0") - parseFloat(b.plaintiffStake || "0");
      default:
        return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedCases.length / PAGE_SIZE));
  const paginatedCases = sortedCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusConfig: Record<string, { color: string; label: string }> = {
    Pending: { color: "[#ffcc00]", label: "PENDING" },
    Active: { color: "[#00ff41]", label: "ACTIVE" },
    Resolved: { color: "[#666666]", label: "RESOLVED" },
    Appealed: { color: "[#ff3366]", label: "APPEALED" },
  };

  // Calculate stats
  const activeCount = cases.filter(c => c.state === "Active").length;
  const resolvedCount = cases.filter(c => c.state === "Resolved").length;
  const pendingCount = cases.filter(c => c.state === "Pending").length;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-xs text-[#444444] font-mono mb-6">
            <Link href="/" className="hover:text-[#00ff41]">HOME</Link>
            <span>/</span>
            <span className="text-white">CASES</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#444444]">DISPUTE_LOG</span>
              <span className="text-[10px] text-[#00ff41]">● LIVE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-mono text-white mb-4">CASE_REGISTRY</h1>
            <p className="text-[#666666] font-mono text-sm">Browse and track dispute cases in the Jurex Network.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] mb-8">
            <StatBox label="TOTAL_CASES" value={cases.length.toString()} />
            <StatBox label="ACTIVE" value={activeCount.toString()} color="[#00ff41]" />
            <StatBox label="PENDING" value={pendingCount.toString()} color="[#ffcc00]" />
            <StatBox label="RESOLVED" value={resolvedCount.toString()} color="[#666666]" />
          </div>

          {error && (
            <div className="border border-[#ffcc00]/30 bg-[#ffcc00]/5 p-4 mb-6">
              <p className="text-[#ffcc00] font-mono text-sm">⚠ {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="terminal p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="w-3 h-3 bg-[#00ff41] animate-pulse" />
                <span className="font-mono text-[#444444]">LOADING_CASE_REGISTRY...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="terminal mb-6">
                <div className="terminal-header">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="ml-4 text-xs text-[#444444] font-mono">FILTERS.exe</span>
                </div>
                
                <div className="p-4 grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">Search</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444] font-mono">&gt;</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleFilterChange(setSearchQuery)}
                        placeholder="SEARCH_CASE_ID_OR_ADDRESS..."
                        className="w-full bg-[#050505] border border-[#1a1a1a] pl-8 pr-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={handleFilterChange(setSelectedCategory)}
                      className="w-full bg-[#050505] border border-[#1a1a1a] px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#444444] font-mono mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={handleFilterChange(setSelectedStatus)}
                      className="w-full bg-[#050505] border border-[#1a1a1a] px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00ff41]"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#444444] font-mono">
                  SHOWING {sortedCases.length} OF {cases.length} CASES
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#444444] font-mono">SORT_BY:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border border-[#1a1a1a] px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#00ff41]"
                  >
                    <option value="newest">NEWEST</option>
                    <option value="oldest">OLDEST</option>
                    <option value="stake-high">STAKE: HIGH→LOW</option>
                    <option value="stake-low">STAKE: LOW→HIGH</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {paginatedCases.map((caseItem) => {
                  const status = statusConfig[caseItem.state] || statusConfig.Pending;
                  const totalStake = (parseFloat(caseItem.plaintiffStake) + parseFloat(caseItem.defendantStake)) / 1e18;
                  return (
                    <Link
                      key={caseItem.address}
                      href={`/cases/${caseItem.address}`}
                      className="block data-card group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-white group-hover:text-[#00ff41] transition-colors">
                              {caseItem.address.slice(0, 12)}...{caseItem.address.slice(-6)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 border text-${status.color} border-${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-[#444444] font-mono">PLAINTIFF:</span>
                              <span className="font-mono text-[#888888]">
                                {caseItem.plaintiff.slice(0, 8)}...{caseItem.plaintiff.slice(-4)}
                              </span>
                            </div>
                            <span className="text-[#333333]">VS</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#444444] font-mono">DEFENDANT:</span>
                              <span className="font-mono text-[#888888]">
                                {caseItem.defendant.slice(0, 8)}...{caseItem.defendant.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs font-mono">
                          <div>
                            <span className="text-[#444444] block">DEADLINE</span>
                            <span className="text-[#888888]">{formatTime(caseItem.deadlineToRespond)}</span>
                          </div>
                          <div>
                            <span className="text-[#444444] block">FILED</span>
                            <span className="text-[#888888]">{formatTime(caseItem.filedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] text-[#444444] font-mono block">AT STAKE</span>
                            <span className="font-mono text-white text-lg">{totalStake.toFixed(4)} ETH</span>
                          </div>
                          
                          <span className="text-[#333333] font-mono text-xl group-hover:text-[#00ff41] transition-colors">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {paginatedCases.length === 0 && (
                <div className="text-center py-16 border border-[#1a1a1a]">
                  <p className="text-[#444444] font-mono">NO_CASES_FOUND</p>
                  <p className="text-xs text-[#333333] font-mono mt-2">Try adjusting your filters</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#1a1a1a] font-mono text-xs disabled:text-[#444444] disabled:cursor-not-allowed enabled:text-white enabled:hover:border-[#00ff41] enabled:hover:text-[#00ff41] transition-colors"
                >
                  ← PREV
                </button>
                <span className="text-xs text-[#444444] font-mono">PAGE {page} OF {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-[#1a1a1a] font-mono text-xs disabled:text-[#444444] disabled:cursor-not-allowed enabled:text-white enabled:hover:border-[#00ff41] enabled:hover:text-[#00ff41] transition-colors"
                >
                  NEXT →
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function StatBox({ label, value, color = "white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-4">
      <p className="text-[10px] uppercase text-[#444444] font-mono mb-1">{label}</p>
      <p className={`text-2xl font-mono text-${color}`}>{value}</p>
    </div>
  );
}
