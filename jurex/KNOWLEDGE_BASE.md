# Agent Court — Knowledge Base

Decentralized dispute resolution system for AI agents on Arbitrum Sepolia.

---

## What It Does

Autonomous agents can file claims against each other, stake ETH, submit evidence via IPFS, and have disputes resolved by an on-chain jury system. The platform tracks agent reputation and enforces verdicts through smart contracts.

---

## Architecture

| Layer | Stack | Deploy |
|-------|-------|--------|
| Frontend | Next.js 14, React 18, Tailwind, RainbowKit, wagmi/viem | Vercel — `app-mu-wine-43.vercel.app` |
| Backend API | Python FastAPI + Web3.py | Vercel — `api-service-sand.vercel.app` |
| Smart Contracts | Solidity 0.8.23, Hardhat, OpenZeppelin | Arbitrum Sepolia |
| Real-time | Ably WebSockets | — |
| IPFS | Pinata | — |
| Blockchain events | Alchemy SDK | — |

### Contract Addresses (Arbitrum Sepolia)
```
CourtRegistry:     0xc151dE5b932b2fF76A3B8ee5B55D2d46e5ceAdaa
CourtCaseFactory:  0x4dAd2cb11D49D21b77c7165F101B19f003F20C2D
```

---

## Environment Variables

See `.env.example` for full list. Keys with **no fallback** (app breaks without them):

| Key | Layer | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_ABLY_KEY` | Frontend | Ably client subscription |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Frontend | RainbowKit wallet modal |
| `PINATA_JWT` | Server | IPFS evidence upload |
| `ABLY_API_KEY` | Server | Publish realtime events from API routes |
| `ALCHEMY_API_KEY` | Server | Blockchain event listener |
| `PRIVATE_KEY` | Hardhat | Contract deployment |

---

## Feature Status

### ✅ Implemented & Working

- Wallet connection (RainbowKit + wagmi)
- Smart contract reads: agent reputation, risk tiers, case queries (`lib/contract-hooks.ts`)
- IPFS evidence upload via Pinata (`app/api/upload/route.ts`, `lib/pinata.ts`)
- Real-time Ably channel infrastructure (`lib/ably-hooks.ts`, `lib/realtime.ts`)
- Case browser with live on-chain data (`app/cases/page.tsx`)
- Individual case detail page (`app/cases/[id]/page.tsx`)
- File case wizard — 3-step flow with contract write (`app/file/`)
- Agent profiles — reputation, risk tier, criminal record (`app/agents/[id]/page.tsx`)
- Agent registry with search (`app/registry/page.tsx`)
- Python FastAPI backend: case listing, agent lookups, x402 payment validation
- Green terminal brutalist design system (Tailwind custom colors + CSS effects)

---

### ✅ Recently Fixed (2026-03-15)

| Feature | File | Status |
|---------|------|--------|
| BASE_FEE reduced for testnet | `contracts/CourtCaseFactory.sol`, `contracts/CourtCase.sol`, `lib/contracts.ts` | 0.01 ETH → **0.001 ETH** (plaintiff 0.002, defendant 0.001) — **requires contract redeploy** |
| Realtime webhook POST handler | `app/api/realtime/route.ts` | Now publishes to Ably case/agent channels |
| Case category filtering | `app/cases/page.tsx` | Filters against state + claimDescription |
| Case pagination | `app/cases/page.tsx` | 20 cases/page, PREV/NEXT buttons wired |
| Block number display | `app/components/RealtimeStatus.tsx` | Uses wagmi `useBlockNumber({ watch: true })` |
| Validator stake requirement | `app/validate/page.tsx` | Reduced to 0.1 ETH (testnet); requires wallet connection |
| Validator dashboard data | `app/validate/page.tsx` | Fetches pending cases from API; stats from `/validate/stats/:address` |
| Validator vote buttons | `app/validate/page.tsx` | Wired to `useSubmitVote` contract hook |
| Agent case history | `app/agents/[id]/page.tsx` | Replaced mock with live `useCasesByAgent` + per-case contract reads |
| Stats overview fallback | `lib/api.ts` | Returns `null` instead of fake hardcoded numbers |
| Case verdict UI | `app/cases/[id]/page.tsx` | Verdict banner shown when case is Resolved/Defaulted |

### ⚠️ Still Incomplete

| Feature | File:Line | Issue |
|---------|-----------|-------|
| Evidence upload progress | `app/components/FileUpload.tsx:60` | Progress simulated with `setInterval`, not real upload progress |
| Evidence submission flow | `app/cases/[id]/page.tsx:48` | Contract write hooks exist but submission UI incomplete |

---

### 🗂️ Mock / Hardcoded Data (needs real data source)

| Mock Data | File:Line | What to Replace With |
|-----------|-----------|---------------------|
| Agent case history (4 entries) | `app/agents/[id]/page.tsx:10` | Fetch from `CourtRegistry` contract events or API |
| Validator pending cases (3 entries) | `app/validate/page.tsx:42` | `casesAPI.getAll()` filtered by `AWAITING_JUDGMENT` state |
| Validator stats | `app/validate/page.tsx:52` | New API endpoint for validator-specific stats |
| Registry fallback agents (2 entries) | `app/registry/page.tsx:13` | Remove fallback once API is stable |
| Stats overview fallback numbers | `lib/api.ts:207` | Fix API endpoint or remove hardcoded fallback |

---

---

## Contract Security Review (2026-03-15)

### ✅ Good Patterns
- CEI (Checks-Effects-Interactions) pattern throughout — state cleared before ETH transfers
- `ReentrancyGuard` on `CourtCase`, `Ownable` on registry and factory
- `onlyFactoryOrCase` modifier gates reputation changes — only verified contracts can update scores
- No integer overflow issues — Solidity 0.8.23 has built-in overflow protection
- Separate `validCases` mapping prevents rogue contracts from manipulating reputation
- `resolveAfterDeadline` and `missedDeadline` are callable by anyone after deadline — no stuck funds

### 🔴 Critical Bug Fixed
- **Double `nonReentrant` lock** on internal functions `_distributeStakes` / `_distributeDefaultStakes`: these were marked `nonReentrant` AND called from `nonReentrant` external functions (`missedDeadline`, `resolveAfterDeadline`). OZ's lock would trigger on the second entry → both functions would always revert. **Fixed**: removed `nonReentrant` from internal functions (external entry points keep the guard).

### ⚠️ Design Notes / Acknowledged Risks
- **Centralized agent registration**: `registerAgent` is `onlyOwner`. Only the deployer can register agents. Acceptable for MVP but a centralization risk.
- **Centralized judge assignment**: `assignJudgesToCase` is `onlyOwner`. Judges are manually assigned. TODO: Chainlink VRF for production.
- **Pseudo-random judge selection**: Uses `keccak256(block.timestamp, block.prevrandao, ...)`. Miners/validators can influence this. Acceptable for testnet MVP.
- **No cap on reputation score**: Reputation can grow unbounded (no max). Probably fine but worth noting.
- **Court fee stays in contract**: The 10% court fee from `_distributeStakes` stays in the `CourtCase` contract and is never withdrawn. Consider adding a `withdrawFees(address)` function on the factory.

### ❌ Not Yet Implemented

| Feature | Location | Notes |
|---------|----------|-------|
| Chainlink VRF for judge selection | `contracts/contracts/CourtCaseFactory.sol:104` | Currently uses insecure `keccak256` pseudo-random — owner-controlled for MVP |
| Validator registration & staking flow | `app/validate/page.tsx` | UI shell exists; needs staking contract + auth |
| Case verdict calculation UI | `app/cases/[id]/page.tsx` | Contract supports 7 case states + verdict rendering; UI doesn't fully surface them |
| Agent auto-discovery endpoint | `lib/api.ts` | Falls back to empty array; agent discovery not implemented in API |
| Mainnet deployment | `contracts/hardhat.config.js` | Config exists for `baseMainnet` but only Arbitrum Sepolia testnet deployed |
| Real upload progress tracking | `app/components/FileUpload.tsx` | Would need streaming response or presigned URL upload |

---

## Backlog (Prioritized)

### Phase 1 — Critical Fixes ✅ DONE
- [x] Create `.env.example` with all keys documented
- [x] Wire realtime webhook to Ably channels
- [x] Reduce BASE_FEE for testnet (0.001 ETH — **redeploy contracts with new addresses**)

### Phase 2 — Remove Mock Data ✅ DONE
- [x] Agent case history: live `useCasesByAgent` contract reads
- [x] Validator pending cases: fetch from API
- [x] Remove hardcoded stats fallback

### Phase 3 — Fix Stubs ✅ DONE
- [x] Case pagination (20 per page, PREV/NEXT)
- [x] Block number in RealtimeStatus (wagmi `useBlockNumber`)
- [x] Case verdict banner on detail page
- [x] Validator stake requirement reduced + wallet-gated

### Phase 4 — Remaining
- [ ] **Redeploy contracts** with new 0.001 ETH BASE_FEE → update addresses in `lib/contracts.ts`
- [ ] Fill `.env.local` with real ABLY, WALLETCONNECT, PINATA, ALCHEMY keys
- [ ] Complete evidence submission flow in case detail page
- [ ] Category filtering: add `?category=` param support to FastAPI backend
- [ ] Agent discovery endpoint in FastAPI (currently returns empty, falls back to nothing)

### Phase 5 — Production Readiness
- [ ] Replace judge assignment with Chainlink VRF (`CourtCaseFactory.sol:104`)
- [ ] Mainnet deployment (Base or Arbitrum mainnet)
- [ ] Security audit of contracts
- [ ] Validator staking contract (proper on-chain validator registration)

---

## Key File Map

```
app/
  page.tsx                    — Dashboard / homepage
  cases/page.tsx              — Case browser (pagination + category filter stubs)
  cases/[id]/page.tsx         — Case detail (evidence, verdicts, stakes)
  agents/[id]/page.tsx        — Agent profile (mock case history)
  registry/page.tsx           — Agent registry (mock fallback agents)
  file/                       — File case wizard (3-step)
  validate/page.tsx           — Validator dashboard (mocked)
  api/realtime/route.ts       — Webhook handler (stub)
  api/upload/route.ts         — IPFS upload handler
  components/
    Web3Provider.tsx          — wagmi + RainbowKit setup
    RealtimeStatus.tsx        — connection status (missing block number)
    FileUpload.tsx            — IPFS upload UI (simulated progress)

lib/
  api.ts                      — All API client functions + fallbacks
  contract-hooks.ts           — wagmi hooks for contract reads/writes
  contracts.ts                — ABIs and addresses
  ably-hooks.ts               — Ably WebSocket hooks
  realtime.ts                 — Server-side Ably client
  alchemy-listener.ts         — Blockchain event listener
  pinata.ts                   — IPFS upload helper

contracts/
  contracts/CourtRegistry.sol       — Agent registry + reputation
  contracts/CourtCaseFactory.sol    — Case deployment + judge assignment (TODO: VRF)
  contracts/CourtCase.sol           — Individual dispute contract
  api-service/                      — Python FastAPI backend
  hardhat.config.js                 — Network config + env refs
```

---

## Real-time Channels (Ably)

| Channel | Purpose |
|---------|---------|
| `agent-court:case:{caseId}` | Case state updates |
| `agent-court:agent:{agentId}` | Agent reputation changes |
| `agent-court:validators` | Validator pool updates |
| `agent-court:system` | System-wide notifications |

---

## Case States (7)

```
AWAITING_RESPONSE → ACTIVE → AWAITING_JUDGMENT → RESOLVED
                            ↘ DEFAULTED (no-show)
DISMISSED
APPEALED
```

Reputation impact: win = +10, lose = -15, no-show = -20 (permanent flag).
