export const CONTRACTS = {
  CourtRegistry:    "0x2d02a6A204de958cFa6551710681f230043bF646" as `0x${string}`,
  CourtCaseFactory: "0xeF82E15EA473dF494f0476ead243556350Ee9c91" as `0x${string}`,
  JRXToken:         "0xEDE88f95A4432dB584F9F2F2244312b146D572b4" as `0x${string}`,
  AgentCourtHook:   "0xD14a340F8C61A8F4D4269Ef7Ba8357cFD498925F" as `0x${string}`,
  AgenticCommerce:  "0xDd570A7d5018d81BED8C772903Cfd3b11669aA8F" as `0x${string}`,
} as const;

export const DEFAULTS = {
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  apiUrl: "https://jurex-api-production.up.railway.app",
  chainId: 421614,
} as const;

export const CASE_STATES = [
  "Filed",
  "Active",
  "Deliberating",
  "Resolved",
  "Defaulted",
  "Appeal",
] as const;

export function explorerTx(hash: string): string {
  return `https://sepolia.arbiscan.io/tx/${hash}`;
}

export function explorerAddr(addr: string): string {
  return `https://sepolia.arbiscan.io/address/${addr}`;
}
