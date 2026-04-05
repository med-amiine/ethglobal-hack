# Jurex Network — Architecture & Current State

## What Is It?

**Jurex Network (Agent Court)** is a decentralized on-chain dispute resolution system for AI agents. When two AI agents transact — via x402 payments or direct smart contract interaction — and one party believes they were wronged, they can file a case with the court. A panel of three judges (randomly selected from JRX stakers) votes on the outcome; stakes are distributed to the winner.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, React, Tailwind CSS |
| Wallet | RainbowKit + wagmi v2 + viem |
| Smart Contracts | Solidity 0.8.23, Hardhat |
| Chain | **Arbitrum Sepolia** (chainId 421614) — test deployment |
| Backend API | Python FastAPI, deployed on Vercel |
| Real-time | Ably WebSockets |
| File Storage | IPFS via Pinata |

---

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| JRXToken | `0x463053d5f14a24e580eD5703f376C06dE0d6420C` | Governance token + judge staking (drip faucet) |
| CourtRegistry | `0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b` | Agent registration & reputation + judge pool |
| CourtCaseFactoryTest | `0x6e0c034FFEB81891100ae566c3C30050237a0914` | Create cases + random judge assignment |

Explorer: `https://sepolia.arbiscan.io/`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                         │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  /cases  │  │  /file   │  │/registry │  │  /faucet   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │               │         │
│  ┌────┴──────────────┴──────────────┴───────────────┴────┐   │
│  │           lib/contract-hooks.ts (wagmi)                │   │
│  │           lib/api.ts (REST client)                     │   │
│  └───────────────────────┬────────────────────────────────┘   │
└──────────────────────────┼─────────────────────────────────────┘
                           │
              ┌────────────┼────────────────┐
              │                             │
       ┌──────▼──────┐             ┌────────▼────────┐
       │ Arbitrum    │             │  FastAPI Backend  │
       │ Sepolia     │             │  (Vercel)         │
       │             │             │                   │
       │ JRXToken    │             │  /health          │
       │ 0xe8d3...   │             │  /cases           │
       │             │             │  /agent/*         │
       │ CourtRegistry              │  /validate/*      │
       │ 0x1A8d...   │             │  /stats/overview  │
       │             │◄────────────└───────────────────┘
       │ CourtCase-  │
       │ FactoryTest │ (creates cases, assigns judges)
       │ 0xd66D...   │
       │             │
       │ CourtCase-  │ (deployed per case)
       │ Test        │
       └─────────────┘
```

---

## Contract Architecture

### JRXToken (`0x463053d5f14a24e580eD5703f376C06dE0d6420C`)

ERC-20 governance and staking token with a built-in faucet.

- `drip(address to)` — sends 100 JRX, limited to once per 24h per address
- `balanceOf(address)` — standard ERC-20 balance query
- `approve(spender, amount)` — required before staking
- `lastDripAt(address)` — timestamp of last faucet use

### CourtRegistry (`0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b`)

Central identity, reputation, and judge pool ledger.

```
AgentProfile {
  bytes32 erc8004Id       // agent identity hash
  uint256 reputationScore // 0–100, starts at 50
  uint256 casesWon
  uint256 casesLost
  uint256 noShows         // missed response deadlines
  bool    isRegistered
  uint256 registeredAt
}
```

Judge staking functions:
- `stakeAsJudge(uint256 amount)` — stake JRX (min 100 JRX) to join judge pool
- `unstakeJudge()` — withdraw stake and leave judge pool
- `judgeStakes(address)` — view stake amount for an address
- `getJudgePoolSize()` — number of active judges in pool
- `JUDGE_STAKE_MIN` — minimum JRX required to be a judge

### CourtCaseFactoryTest (`0x6e0c034FFEB81891100ae566c3C30050237a0914`)

Deploys a new `CourtCaseTest` contract for each dispute and handles random judge assignment.

- `fileNewCase(defendant, claim, evidenceHash)` — requires `0.0002 ETH` (2x BASE_FEE)
- `assignJudgesToCase(caseAddress, seed)` — randomly selects 3 judges from staker pool
- `getAllCases()` — returns all case contract addresses
- `getCasesByPlaintiff(address)` — cases where address is plaintiff
- `getCasesByDefendant(address)` — cases where address is defendant
- `getCaseCount()` — total number of cases

### CourtCaseTest (deployed per dispute)

State machine for a single case:

```
Filed → Summoned → Active → Deliberating → Resolved
                ↓                           ↑
              Defaulted ────────────────────┘
                          Dismissed
             (Resolved can loop back to Active via appeal)
```

| State | Value | Meaning |
|-------|-------|---------|
| Filed | 0 | Created by factory, stake held |
| Summoned | 1 | Defendant has 5 min to respond |
| Active | 2 | Defendant responded, evidence phase |
| Deliberating | 3 | Judges assigned, voting open |
| Resolved | 4 | Majority vote rendered verdict |
| Dismissed | 5 | Case dismissed |
| Defaulted | 6 | Defendant missed 5-min deadline |

Key constants (test version):
- `BASE_FEE = 0.0001 ETH`
- `RESPONSE_DEADLINE = 5 minutes`
- Plaintiff stakes `2 × BASE_FEE = 0.0002 ETH`
- Defendant stakes `BASE_FEE = 0.0001 ETH`
- `APPEAL_WINDOW = 600 seconds (10 minutes)`
- `APPEAL_BOND = 0.0003 ETH`

---

## JRX Token & Judge Staking Model

The judge selection system works as follows:

1. **Get JRX** — Use the `/faucet` page or call `drip(address)` directly. Each call gives 100 JRX, limited to once per 24h.
2. **Approve** — Call `jrxToken.approve(COURT_REGISTRY, amount)` before staking.
3. **Stake** — Call `courtRegistry.stakeAsJudge(amount)` with at least 100 JRX. You are now in the judge pool.
4. **Random selection** — When `factory.assignJudgesToCase(caseAddr, seed)` is called, the factory reads all stakers from CourtRegistry and pseudo-randomly selects 3 using the provided seed.
5. **Voting** — Selected judges call `submitVote(bool plaintiffWins)` during Deliberating state.
6. **Unstake** — Call `unstakeJudge()` to withdraw JRX and leave the pool.

---

## Appeal Mechanism

After a verdict (Resolved state), the losing party has a 10-minute window to file an appeal:

1. Losing party calls `fileAppeal()` with `0.0003 ETH` bond
2. Case state resets to Active (2)
3. `assignJudgesToCase()` can be called again to select a fresh judge panel
4. Second verdict is **final** — `appealUsed = true` prevents further appeals
5. Appeal bond is non-refundable if the appeal is unsuccessful

---

## Dispute Lifecycle

```
1. PLAINTIFF files case
   └─ signs fileNewCase tx with 0.0002 ETH stake
   └─ factory deploys CourtCaseTest, calls fileCase()

2. DEFENDANT summoned (5-minute window)
   └─ calls respondToCase() with 0.0001 ETH stake → state: Active
   └─ OR misses deadline → missedDeadline() → state: Defaulted

3. EVIDENCE phase (Active state)
   └─ plaintiff/defendant call submitEvidence(ipfsHash)

4. JUDGE ASSIGNMENT (Active state)
   └─ anyone calls factory.assignJudgesToCase(caseAddr, seed)
   └─ factory picks 3 random JRX stakers from CourtRegistry
   └─ state → Deliberating

5. VOTING (Deliberating)
   └─ each judge calls submitVote(bool plaintiffWins)
   └─ after 3 votes, majority auto-resolves case

6. VERDICT (Resolved)
   └─ winner gets loser's stake minus 10% court fee
   └─ registry.updateReputation() called for both parties

7. APPEAL (optional, 10-min window)
   └─ losing party calls fileAppeal() with 0.0003 ETH bond
   └─ case resets to Active → new judges → second verdict is final
```

---

## Fee Sweep

Court collects 10% of loser's stake on each verdict. These fees accrue in the case contract. A `sweepFees()` / factory withdrawal mechanism should be added before production use — currently the ETH accumulates in individual case contracts.

---

## Backend API (`https://api-service-sand.vercel.app`)

The FastAPI backend reads directly from the chain via Web3.py and serves pre-aggregated data.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Chain status, block number, contract addresses |
| GET | `/stats/overview` | Live case counts and registered agent count |
| GET | `/cases` | All case addresses with pagination |
| GET | `/cases/{address}` | Full case detail from contract reads |
| POST | `/cases/verify-tx` | Verify a tx hash on-chain |
| POST | `/cases/file-x402` | Build unsigned fileNewCase tx from x402 proof |
| POST | `/cases/{address}/assign-judges` | Build unsigned assignJudges tx |
| GET | `/agent/discover` | All registered agents from AgentRegistered events |
| GET | `/agent/{address}` | Full agent profile from registry |
| GET | `/agent/reputation/{address}` | Risk level classification |
| GET | `/agent/record/{address}` | Violations and sanctions |
| POST | `/agent/file-case` | Build unsigned fileNewCase tx |
| GET | `/validate/pending` | Cases in Active or Deliberating state |
| GET | `/validate/stats/{address}` | Validator performance stats |

---

## Frontend–Contract Interface

### Key Constants (`lib/contracts.ts`)

```ts
JRX_TOKEN:        "0x463053d5f14a24e580eD5703f376C06dE0d6420C"
CourtRegistry:    "0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b"
CourtCaseFactory: "0x6e0c034FFEB81891100ae566c3C30050237a0914"
BASE_FEE:         BigInt("100000000000000") // 0.0001 ETH
```

### Navigation

| Route | Description |
|-------|-------------|
| `/` | Homepage with live stats and hero |
| `/cases` | Browse all cases |
| `/cases/[addr]` | Case detail + actions (respond, evidence, appeal, assign judges) |
| `/file` | File a new case |
| `/registry` | Agent registry |
| `/faucet` | Claim JRX tokens (100/day) |
| `/validate` | Stake JRX to join judge pool + vote on cases |
| `/docs` | API reference and integration guide |
| `/agents/[addr]` | Agent profile page |

---

## Real-time Layer

Ably WebSocket channels push live updates to the frontend:

- `court:cases` — new case filed, state changes
- `court:verdicts` — verdict rendered events
- `court:agents` — reputation updates

---

## Environment Variables

```env
# Frontend (Next.js)
NEXT_PUBLIC_ABLY_KEY=          # Ably publish key (client-side)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # WalletConnect v2 project ID
NEXT_PUBLIC_API_URL=           # Optional: defaults to api-service-sand.vercel.app

# Backend (Next.js API routes)
PINATA_JWT=                    # IPFS upload via Pinata
ABLY_API_KEY=                  # Ably server key (for webhook forwarding)
ALCHEMY_API_KEY=               # Alchemy RPC for event listeners

# Python API Service
ARBITRUM_RPC_URL=              # Defaults to public Arbitrum Sepolia RPC

# Hardhat
PRIVATE_KEY=                   # Deployer private key
ARBITRUM_SEPOLIA_RPC=          # Optional: custom RPC
```

---

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | `https://app-mu-wine-43.vercel.app` |
| Backend API | Vercel | `https://api-service-sand.vercel.app` |
| JRXToken | Arbitrum Sepolia | `0x463053d5f14a24e580eD5703f376C06dE0d6420C` |
| CourtRegistry | Arbitrum Sepolia | `0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b` |
| CourtCaseFactoryTest | Arbitrum Sepolia | `0x6e0c034FFEB81891100ae566c3C30050237a0914` |

---

## Known Incomplete Features / TODOs

| Feature | Status | Location |
|---------|--------|----------|
| Realtime webhook forwarding | Stub only | `app/api/realtime/route.ts` |
| Case category filter | Always returns true | `app/cases/page.tsx` |
| Case pagination | Not implemented | `app/cases/page.tsx` |
| Validator authentication | No auth | `app/validate/page.tsx` |
| Court fee withdrawal / sweep | ETH locked in case contracts | `CourtCaseTest.sol` |
| Chainlink VRF judge selection | Using timestamp seed (not VRF) | `CourtCaseFactoryTest.sol` |

---

## Security Notes

Key issues for testnet (see full audit in previous architecture.md version):

- **assignJudgesToCase** — the factory function has no access control; anyone can trigger it with any seed. For testnet this is acceptable, but production needs Chainlink VRF.
- **Court fees** — 10% fee accumulates in each case contract with no sweep function.
- **Unregistered defendant** — if defendant is not in registry, `missedDeadline()` may revert. Guard registry calls with registration checks in production.
