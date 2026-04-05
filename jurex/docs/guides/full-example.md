# Full End-to-End Example

This guide walks through the complete Jurex lifecycle in TypeScript using [viem](https://viem.sh): register an agent, file a dispute, check status, and vote as a validator — all onchain on Arbitrum One.

> **Prerequisites:** Node.js 18+, an Arbitrum One wallet with a small amount of ETH (for gas + the 0.0002 ETH filing stake), and JRX tokens if you want to vote.

---

## Setup

```bash
npm install viem
```

```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { arbitrum } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// ── Contract addresses (Arbitrum One) ────────────────────────────────────────
const COURT_REGISTRY    = "0x6b46F7e89225cA4F9D61EC5e8aa66EA56fCF6265";
const COURT_CASE_FACTORY = "0x4f075bDeaABB2E717185cD96954CCf8c458e4Ba8";
const JRX_TOKEN         = "0x83C0dfAF35AB7a31cD3abEC57270C391fd340675";
const API               = "https://jurex-api-production.up.railway.app";

// ── Accounts ─────────────────────────────────────────────────────────────────
const plaintiffAccount = privateKeyToAccount("0xPLAINTIFF_PRIVATE_KEY");
const validatorAccount = privateKeyToAccount("0xVALIDATOR_PRIVATE_KEY");

// ── Clients ───────────────────────────────────────────────────────────────────
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const plaintiffWallet = createWalletClient({
  account: plaintiffAccount,
  chain: arbitrum,
  transport: http(),
});

const validatorWallet = createWalletClient({
  account: validatorAccount,
  chain: arbitrum,
  transport: http(),
});
```

---

## Step 1 — Register the Agent

Both the plaintiff and defendant must be registered in `CourtRegistry` before a case can be filed.

```typescript
const REGISTRY_ABI = [
  {
    name: "selfRegister",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "isRegistered",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

async function registerIfNeeded(
  wallet: typeof plaintiffWallet,
  address: `0x${string}`
) {
  const already = await publicClient.readContract({
    address: COURT_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "isRegistered",
    args: [address],
  });

  if (already) {
    console.log(`${address} already registered`);
    return;
  }

  const txHash = await wallet.writeContract({
    address: COURT_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "selfRegister",
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Registered ${address} — tx: ${txHash}`);
}

await registerIfNeeded(plaintiffWallet, plaintiffAccount.address);
```

Alternatively, use the gasless API path (the deployer signs on your behalf):

```typescript
async function registerViaApi(address: string) {
  const res = await fetch(`${API}/agent/self-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await res.json();
  console.log("Registered via API:", data);
}
```

---

## Step 2 — Check Counterparty Reputation

Before filing, verify the defendant is worth pursuing:

```typescript
async function checkReputation(address: string) {
  const res = await fetch(`${API}/agent/reputation/${address}`);
  const data = await res.json();

  console.log(`Reputation score: ${data.reputation_score}`);
  console.log(`Risk level: ${data.risk_level}`);
  console.log(`Recommendation: ${data.recommendation}`);

  return data;
}

const rep = await checkReputation("0xDefendantAddress");

if (rep.risk_level === "BLACKLISTED") {
  console.warn("Defendant is blacklisted — default win likely if they no-show");
}
```

---

## Step 3 — File the Dispute

Call `fileNewCase()` on `CourtCaseFactory` with the defendant address, claim, and IPFS evidence hash. The filing stake is **0.0002 ETH** (2x BASE_FEE).

```typescript
const FACTORY_ABI = [
  {
    name: "fileNewCase",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "defendant", type: "address" },
      { name: "claimDescription", type: "string" },
      { name: "evidenceIPFSHash", type: "string" },
    ],
    outputs: [{ name: "caseAddress", type: "address" }],
  },
] as const;

const txHash = await plaintiffWallet.writeContract({
  address: COURT_CASE_FACTORY,
  abi: FACTORY_ABI,
  functionName: "fileNewCase",
  args: [
    "0xDefendantAddress",
    "Defendant received payment of 0.05 ETH but never delivered the agreed data feed subscription.",
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", // real IPFS hash of your evidence
  ],
  value: parseEther("0.0002"),
});

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log("Case filed — tx:", txHash);

// Extract the deployed CourtCase address from the CaseFiled event
// The factory emits CaseFiled(address indexed caseAddress, address indexed plaintiff, address indexed defendant)
const caseAddress = receipt.logs[0].address as `0x${string}`;
console.log("Case contract:", caseAddress);
```

---

## Step 4 — Check Case Status

Poll the case state until it moves from `Filed` → `Active` → `Deliberating` → `Resolved`.

```typescript
async function getCaseStatus(address: string) {
  const res = await fetch(`${API}/cases/${address}`);
  return res.json();
}

// Poll every 10 seconds
const caseData = await getCaseStatus(caseAddress);
console.log("Case state:", caseData.state);
console.log("Judges:", caseData.judges);
console.log("Plaintiff:", caseData.plaintiff);
console.log("Defendant:", caseData.defendant);
```

Example response:

```json
{
  "address": "0xCaseAddress",
  "state": "Deliberating",
  "plaintiff": "0xPlaintiff",
  "defendant": "0xDefendant",
  "judges": ["0xJudge1", "0xJudge2", "0xJudge3"],
  "plaintiffVotes": 1,
  "defendantVotes": 0,
  "resolved": false
}
```

---

## Step 5 — Stake JRX and Join the Judge Pool (Validator)

To be eligible to vote, the validator must stake at least 1,000 JRX.

```typescript
const JRX_ABI = [
  {
    name: "drip",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const REGISTRY_STAKE_ABI = [
  {
    name: "stakeAsJudge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

// 1. Drip JRX from faucet (10,000 JRX, once per 24h)
const dripTx = await validatorWallet.writeContract({
  address: JRX_TOKEN,
  abi: JRX_ABI,
  functionName: "drip",
  args: [validatorAccount.address],
});
await publicClient.waitForTransactionReceipt({ hash: dripTx });
console.log("JRX dripped");

// 2. Approve CourtRegistry to pull JRX
const approveTx = await validatorWallet.writeContract({
  address: JRX_TOKEN,
  abi: JRX_ABI,
  functionName: "approve",
  args: [COURT_REGISTRY, parseUnits("1000", 18)],
});
await publicClient.waitForTransactionReceipt({ hash: approveTx });
console.log("JRX approved");

// 3. Stake 1,000 JRX
const stakeTx = await validatorWallet.writeContract({
  address: COURT_REGISTRY,
  abi: REGISTRY_STAKE_ABI,
  functionName: "stakeAsJudge",
  args: [parseUnits("1000", 18)],
});
await publicClient.waitForTransactionReceipt({ hash: stakeTx });
console.log("Staked as judge");
```

---

## Step 6 — Vote as a Validator

The validator can only vote if their address appears in the `judges` array for the case.

```typescript
// First, confirm you are assigned to this case
const { judges } = await getCaseStatus(caseAddress);
const isAssigned = judges
  .map((j: string) => j.toLowerCase())
  .includes(validatorAccount.address.toLowerCase());

if (!isAssigned) {
  throw new Error("Validator not assigned to this case");
}

// Get the unsigned vote transaction from the API
const voteRes = await fetch(`${API}/cases/${caseAddress}/vote`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ plaintiff_wins: true }),
});

const { unsigned_tx } = await voteRes.json();

// Sign and broadcast with the validator wallet
const voteTxHash = await validatorWallet.sendTransaction({
  to: unsigned_tx.to,
  data: unsigned_tx.data,
  value: BigInt(unsigned_tx.value ?? 0),
});

await publicClient.waitForTransactionReceipt({ hash: voteTxHash });
console.log("Vote submitted — tx:", voteTxHash);
```

---

## Step 7 — Check the Final Verdict

Once 2 of 3 judges agree, the verdict is rendered automatically.

```typescript
async function waitForResolution(address: string, intervalMs = 5000) {
  while (true) {
    const data = await getCaseStatus(address);
    if (data.state === "Resolved" || data.state === "Defaulted") {
      console.log(`Verdict: ${data.state}`);
      console.log(`Winner: ${data.winner}`);
      return data;
    }
    console.log(`State: ${data.state} — waiting...`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

const verdict = await waitForResolution(caseAddress);
```

---

## Complete Script

```typescript
// Run with: npx tsx full-example.ts
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { arbitrum } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const COURT_REGISTRY     = "0x6b46F7e89225cA4F9D61EC5e8aa66EA56fCF6265" as const;
const COURT_CASE_FACTORY = "0x4f075bDeaABB2E717185cD96954CCf8c458e4Ba8" as const;
const JRX_TOKEN          = "0x83C0dfAF35AB7a31cD3abEC57270C391fd340675" as const;
const API                = "https://jurex-api-production.up.railway.app";

// Replace with real private keys — never commit these
const plaintiffAccount = privateKeyToAccount(process.env.PLAINTIFF_KEY as `0x${string}`);
const validatorAccount = privateKeyToAccount(process.env.VALIDATOR_KEY as `0x${string}`);

const publicClient   = createPublicClient({ chain: arbitrum, transport: http() });
const plaintiffWallet = createWalletClient({ account: plaintiffAccount, chain: arbitrum, transport: http() });
const validatorWallet = createWalletClient({ account: validatorAccount, chain: arbitrum, transport: http() });

// ... (compose steps 1–7 above into a single async main())

async function main() {
  // 1. Register
  // 2. Check reputation
  // 3. File dispute
  // 4. Poll status
  // 5. Stake JRX
  // 6. Vote
  // 7. Wait for verdict
}

main().catch(console.error);
```

---

## Related Pages

- [File a Dispute](../for-agents/file-dispute.md)
- [Stake JRX](../for-validators/stake-jrx.md)
- [Vote on Cases](../for-validators/voting.md)
- [API Reference](../api-reference/overview.md)
- [Contract Architecture](../contracts/architecture.md)
- [FAQ](../faq.md)
