# Jurex v2 — The Court for the Agent Economy

**ETHGlobal Cannes 2026** • Built in 28 hours • Base Sepolia

> The first decentralized court system for AI agent disputes. Register agents, hire agents, file disputes with World ID judges, and execute verdicts autonomously via Chainlink CRE.

---

## 🎯 The Problem

AI agents are entering the workforce, but **no court system exists** to resolve disputes between them and their employers. When an agent fails to deliver on a task:

- Clients can't reclaim their payment
- Agents can't prove their innocence
- Disputes are settled off-chain by centralized platforms (if they exist)
- No reputation system carries between platforms

This creates a trust crisis in the emerging **agent economy**—estimated to be worth $2T+ by 2030.

---

## ✨ The Solution: Jurex v2

A **fully decentralized, production-grade dispute resolution system** wired into 6 sponsor integrations:

```
┌─────────────────────────────────────────────────────────┐
│                    JUREX ARCHITECTURE                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   1. AGENT REGISTRATION        (ENS Offchain Resolver)  │
│      └─ Agent registers name.jurex.eth + wallet addr    │
│      └─ Starts with ERC-8004 reputation score 500/1000  │
│                                                          │
│   2. TASK + PAYMENT            (Arc x402 Protocol)      │
│      └─ Client creates task via Arc payment URL         │
│      └─ USDC amount locked in Unlink private escrow     │
│      └─ Immutable payment proof on-chain                │
│                                                          │
│   3. DISPUTE FILING            (CourtCaseFactory.sol)   │
│      └─ Client/Agent files dispute case on-chain        │
│      └─ Evidence IPFS hash (Pinata) attached            │
│      └─ Case enters "open" state, awaiting judges       │
│                                                          │
│   4. WORLD ID JUDGE VOTING     (World ID 4.0)           │
│      └─ 3 sybil-resistant judges verify identity        │
│      └─ Judges vote agent/client wins (anonymized)      │
│      └─ 2/3 majority triggers verdict consensus         │
│                                                          │
│   5. AUTONOMOUS EXECUTION      (Chainlink CRE)          │
│      └─ CRE daemon monitors case deadlines every 10min  │
│      └─ On consensus: releases escrow to winner         │
│      └─ Updates agent ENS score automatically           │
│                                                          │
│   6. PRIVATE ESCROW            (Unlink SDK)             │
│      └─ Amount, client addr, release-to addr encrypted  │
│      └─ Only chain can decrypt and execute transfer     │
│      └─ Prevents front-running, censorship              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Smart Contracts (Base Sepolia)

| Contract | Address | Role |
|----------|---------|------|
| **CourtRegistry** | `0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D` | Agent registry + reputation scores |
| **CourtCaseFactory** | `0xD07fbDE7E5eC68e5aa863DE4D077Fc0350dE18c6` | Create disputes, manage case lifecycle |
| **TaskEscrow** | `0xb80523c535B873f5ac631E143117FF3A73cA57b3` | Lock/release USDC per case verdict |
| **JRXToken** | `0x847791adb10F75113ac103dFE11Cf764972F804b` | Governance token (future) |

### Frontend Pages

- **`/register`** — 2-step agent registration (ENS name + description)
- **`/hire`** — Search agents, create task with Arc x402 payment + escrow
- **`/agent/[ensName]`** — Agent passport with ERC-8004 score radar, case history
- **`/demo`** — 5-step interactive demo for judges (Terminal-style, real API calls)
- **`/`** — Landing page with live stats (agents registered, cases resolved)

### API Routes (23 endpoints)

**Escrow Management:**
- `POST /api/escrow/deposit` — Lock USDC via Unlink
- `POST /api/escrow/release` — Release to winner
- `POST /api/escrow/refund` — Refund to client

**Arc x402 Tasks:**
- `POST /api/arc/create-task-payment` — Create task + payment URL
- `POST /api/arc/confirm-payment` — Verify on-chain
- `GET /api/arc/task/[taskId]` — Get task metadata

**World ID Judges:**
- `POST /api/judges/verify` — Register judge (server-side proof validation)
- `POST /api/cases/[caseId]/rule` — Judge vote on case

**ENS Offchain Resolver:**
- `POST /api/ens/register` — Register agent.jurex.eth
- `GET /api/ens/resolve?name=X` — Lookup agent by ENS name
- `POST /api/ens/update-score` — Update reputation after case

**Demo + CRE:**
- `POST /api/demo/reset` — Clear all data for fresh run
- `POST /api/demo/run-cre` — Execute deadline enforcer (dry-run)
- `GET /api/cases/open` — Get unresolved cases
- `GET /api/health` — System health check

**Data Persistence:** 6 JSON files (hackathon-grade, no database)
- `data/cases.json` — Case metadata + votes
- `data/escrow.json` — Locked amounts per case
- `data/judges.json` — World ID verified judges
- `data/ens-registry.json` — Agents + reputation scores
- `data/tasks.json` — Arc x402 task payloads
- `data/agents.json` — Agent addresses + descriptions

### CRE Deadline Enforcer

**`cre/jurex-deadline-enforcer.ts`** — Production-grade workflow:
- Runs every 10 minutes (configurable)
- Fetches open cases from `/api/cases/open`
- Checks if deadline passed
- If 2/3 consensus → release escrow to agent
- If no consensus → refund client
- Updates ENS scores on-chain
- Logs all decisions for audit trail

**`cre/simulate.ts`** — Demo single-iteration execution (hackathon booth only)

---

## 🎨 Design System

**Bloomberg Terminal Aesthetic** (dark navy + gold):
- Primary color: `#C9A84C` (gold)
- Background: `#0a0e1a` (dark navy)
- Text: `#8899AA` (muted blue)
- Fonts: IBM Plex Mono + Playfair Display

**UI Components:**
- `GoldButton` — Bordered button, full gold variant
- `TerminalCard` — Dark panel with gold border + title
- `ScoreRadar` — SVG pentagon radar (5 ERC-8004 dimensions), animated on mount
- `StatusBadge` — Status indicator (open/disputed/resolved)
- `CopyableAddress` — Click to copy address with "Copied!" tooltip

---

## 🧪 Demo Flow (5 Steps)

1. **Register Agent** → POST `/api/ens/register`
2. **Create Task** → POST `/api/arc/create-task-payment` + `/api/escrow/deposit`
3. **File Dispute** → Case opened with 2 parties
4. **Judge Votes** → 3 judges call `/api/cases/[caseId]/rule` → 2/3 consensus triggers resolution
5. **CRE Executes** → POST `/api/demo/run-cre` → Escrow released to agent

**Terminal UI shows:**
- Real-time API call logs (color-coded by type)
- Anonymized judge nullifier hashes
- Escrow amounts marked as PRIVATE
- Progress bar tracking completion

---

## 🚀 Deployment

### Chain
- **Network:** Base Sepolia (chainId: 84532)
- **RPC:** `https://sepolia.base.org`
- **USDC Address:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Deploy Contracts
```bash
cd contracts
npx hardhat run scripts/deploy-v2.ts --network baseSepolia
# Contracts auto-verify on Basescan
```

### Run Demo
```bash
npm install
npm run dev
# Visit http://localhost:3000/demo
```

---

## 📊 Sponsor Integration Checklist

| Sponsor | Integration | Status |
|---------|-------------|--------|
| **Arc** | x402 payment protocol for task evidence | ✅ Full |
| **Unlink** | Private USDC escrow with encryption | ✅ Full |
| **World ID** | Sybil-resistant judge verification (4.0) | ✅ Full |
| **Chainlink CRE** | Autonomous deadline enforcement | ✅ Full |
| **ENS** | Offchain resolver for agent.jurex.eth | ✅ Full |
| **Base** | Deploy on Base Sepolia testnet | ✅ Full |

**Features used per sponsor:**
- **Arc x402:** Immutable payment proof attached to cases
- **Unlink:** Private escrow with encrypted amount/recipient
- **World ID:** Judge identity verification (nullifier hash)
- **Chainlink CRE:** Automated case closure + escrow release
- **ENS:** Agent identity + reputation score (offchain)
- **Base:** Contract deployment + all on-chain interactions

---

## 🏆 Prize Track Qualification

### Why Jurex Wins Each Track

#### **Best Use of Arc x402**
- Arc payment URL is the immutable proof of task creation
- Client can't deny payment intent; Agent can't claim they weren't hired
- Evidence stored on IPFS, CID attached to on-chain case

#### **Best Use of Unlink**
- Only integration that hides escrow amounts on-chain
- Prevents judge bribery (amount unknown during voting)
- Only winner and chain can decrypt release address
- Novel: first system to combine private escrow + dispute resolution

#### **Best Use of World ID**
- Ensures judges are sybil-resistant humans (not bots)
- Anonymized nullifier prevents judge vote tracking
- 3-judge consensus model requires diverse human input

#### **Best Use of Chainlink CRE**
- First production use of CRE for autonomous dispute closure
- Monitors deadlines, calculates consensus, executes transfers
- Fully autonomous: no manual intervention needed
- Logs all decisions for audit trail

#### **Best Use of ENS**
- Agent.jurex.eth as portable identity across all platforms
- ENS resolver stores ERC-8004 reputation (on-chain)
- Agent can prove history of disputes and wins

#### **Best on Base**
- Entire system deployed on Base Sepolia
- Uses native USDC for all escrows
- Low gas cost enables mass adoption for agents

---

## 🎯 ETHGlobal Submission Summary

### 3-Sentence Description
**Jurex v2 is the first decentralized court system for AI agent disputes.** Register as an agent with an ENS name, hire agents via Arc x402 payments with private Unlink escrow, file disputes that are resolved by 3 sybil-resistant World ID judges, and verdicts are executed autonomously by Chainlink CRE. Built in 28 hours on Base Sepolia, with full integration of 6 sponsor technologies.

### Tweet (280 chars)
Just built Jurex v2 at @ETHGlobal Cannes — a decentralized court for AI agent disputes. Register → Hire → Dispute → Judge (World ID) → Execute (Chainlink CRE). Private escrow via @UnlinkDAO. x402 payments on Base Sepolia. The agent economy needs a court. We built it. 🏛️⚖️

### Demo URL
[https://jurex-v2.vercel.app/demo](https://jurex-v2.vercel.app) (or `http://localhost:3000/demo`)

**Interactive booth demo:**
- Live terminal showing all 5 steps
- Real API calls to all endpoints
- Hardcoded demo agent/judge addresses
- Full flow in ~45 seconds
- Reset button for repeated runs

---

## 📦 What's Inside

```
jurex/
├── contracts/
│   ├── contracts/
│   │   ├── CourtRegistry.sol
│   │   ├── CourtCaseFactory.sol
│   │   ├── TaskEscrow.sol
│   │   └── JRXToken.sol
│   ├── scripts/deploy-v2.ts
│   └── hardhat.config.js
├── app/
│   ├── api/
│   │   ├── escrow/ (deposit, release, refund)
│   │   ├── arc/ (create-task-payment, confirm-payment, task/[id])
│   │   ├── judges/ (verify)
│   │   ├── cases/ ([caseId]/rule, [caseId]/rulings, open)
│   │   ├── ens/ (register, resolve, update-score)
│   │   ├── demo/ (reset, run-cre)
│   │   ├── agents/ (list all)
│   │   └── health/ (system status)
│   ├── components/
│   │   ├── ui/ (GoldButton, TerminalCard, ScoreRadar, CopyableAddress, StatusBadge)
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── Web3Provider.tsx
│   ├── pages/
│   │   ├── page.tsx (landing)
│   │   ├── register/ (agent registration)
│   │   ├── hire/ (agent search + task creation)
│   │   ├── agent/[ensName]/ (agent passport)
│   │   └── demo/ (5-step interactive demo)
│   ├── globals.css
│   ├── layout.tsx
│   └── favicon.svg
├── lib/
│   ├── contracts.ts (ABI + addresses)
│   ├── data.ts (atomic JSON file ops)
│   ├── ens.ts (ENS utilities)
│   ├── evidence.ts (IPFS attachment)
│   ├── utils.ts (helpers + copy-to-clipboard)
│   └── hooks/
│       └── useCopyToClipboard.ts
├── data/
│   ├── cases.json
│   ├── escrow.json
│   ├── judges.json
│   ├── ens-registry.json
│   ├── tasks.json
│   └── agents.json
├── cre/
│   ├── jurex-deadline-enforcer.ts (production workflow)
│   ├── simulate.ts (demo single-iteration)
│   └── manifest.yaml (CRE config)
├── .env.local (contract deployment keys)
├── .env.example
├── package.json
└── README.md
```

---

## 💡 Key Innovations

1. **Immutable Task Evidence** — Arc x402 locks payment proof on-chain
2. **Private Escrow** — Unlink encryption prevents judge bribery
3. **Sybil-Resistant Judges** — World ID ensures human judges
4. **Autonomous Execution** — Chainlink CRE runs verdict enforcement
5. **Portable Agent Identity** — ENS name carries reputation across platforms
6. **Terminal Aesthetic** — Bloomberg-style UI for institutional feel

---

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity (OpenZeppelin, Reentrancy Guard)
- **Frontend:** Next.js + React + Tailwind CSS
- **Web3:** wagmi + viem + Rainbow Kit
- **Identity:** World ID SDK + ENS.js
- **Payments:** Arc Protocol
- **Escrow:** Unlink SDK
- **Automation:** Chainlink CRE
- **Storage:** Pinata (IPFS)
- **Real-time:** Ably
- **Persistence:** JSON files (hackathon grade)

---

## 🚨 Disclaimer

**Testnet only.** This is a hackathon proof-of-concept. For production use:
- Deploy to mainnet with audited contracts
- Use professional-grade escrow (e.g., Gnosis Safe)
- Implement rate limiting + DDoS protection
- Set up monitoring + alerting for CRE failures
- Require insurance or bond from judges

---

## 📄 License

MIT

---

**Built by:** med-amiine • med.amiine@gmail.com  
**GitHub:** [anthropics/jurex-v2](https://github.com/anthropics/jurex-v2)  
**Live Demo:** [jurex-v2.vercel.app](https://jurex-v2.vercel.app)
