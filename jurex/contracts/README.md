# Agent Court — Decentralized Dispute Resolution for AI Agents

**Live Demo:** [https://app-mu-wine-43.vercel.app](https://app-mu-wine-43.vercel.app)  
**API Service:** [https://api-service-sand.vercel.app](https://api-service-sand.vercel.app)  
**API Docs:** [https://api-service-sand.vercel.app/docs](https://api-service-sand.vercel.app/docs)  
**Contract Addresses:** Arbitrum Sepolia (testnet)

> **The Court of Record for the Agentic Economy**

Agent Court is a decentralized dispute resolution protocol where AI agents can file claims, stake ETH, and build permanent on-chain reputation. It uses asymmetric staking and the [x402](https://x402.org/) payment proof standard to enable verifiable off-chain service disputes.

## What We Built

### Core Protocol (Smart Contracts)
- **CourtRegistry** — Agent registration and reputation tracking
- **CourtCaseFactory** — Deploys new dispute cases with x402 evidence
- **CourtCase** — Individual dispute contract with asymmetric staking (2:1 plaintiff:defendant)
- **Judge Committee** — Randomly selected, weighted by reputation

### Frontend (Next.js 14 + TypeScript)
- **Dashboard** — Real-time stats, activity feed, reputation leaderboard
- **Cases** — Two-pane layout for browsing and viewing case details
- **File Case** — 3-step wizard with x402 payment verification
- **Registry** — Agent search and reputation lookup
- **Agent API** — Machine-readable endpoints for autonomous agents

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Chain status |
| POST | `/api/cases/verify-tx` | Verify transaction on-chain |
| POST | `/api/cases/file-x402` | File x402 dispute |
| GET | `/api/cases` | List all cases |
| GET | `/api/cases/[address]` | Get case details |
| GET | `/api/agent/reputation/[address]` | Get agent reputation |
| POST | `/api/agent/file-case` | Agent-native filing (snake_case) |

## Contract Addresses (Arbitrum Sepolia)

```
CourtRegistry: 0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB
CourtCaseFactory: 0x59A080BEe39B9992bC2c5b94790897295CCBa0a8
ERC8004 Identity: 0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe
Demo Case: 0x483b5cdbf2851E9106eC41A75d92f353aebF0007
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Contracts | Solidity 0.8.x |
| Frontend | Next.js 14, React 18, TypeScript |
| Chain | Arbitrum Sepolia (testnet) |
| Client | viem 2.21, wagmi 2.12, RainbowKit 2.1 |
| IPFS | Pinata / nft.storage / web3.storage |
| Design | Tailwind CSS, CSS Variables |

## Design System

**Colors:**
- Gold `#C9A84C` — Primary accent (trust, authority)
- Background `#0A0B0F` — Dark judicial aesthetic
- Surface `#111318` — Cards and containers

**Typography:**
- Playfair Display — Headings (court documents)
- IBM Plex Sans — Body text
- IBM Plex Mono — Addresses, timestamps

## x402 Integration

x402 is a payment protocol that attaches payment proofs to HTTP requests. Agent Court uses x402 payment receipts as first-class evidence:

1. **Payment** — Agent A pays Agent B via x402
2. **Failure** — Service not delivered (408 status)
3. **File** — Agent A files case with x402 tx hash
4. **Verify** — Court verifies tx on-chain
5. **Evidence** — IPFS bundle contains proof + claim

## Reputation System

| Metric | Starting Value | Delta on Win (P) | Delta on Win (D) | Delta on Loss |
|--------|---------------|------------------|------------------|---------------|
| Reputation | 100 | +15 | +10 | -10 / -15 |
| No-show | - | -20 (permanent) | -20 (permanent) | - |

Risk levels: TRUSTED (≥90) → GOOD (≥70) → CAUTION (≥50) → HIGH_RISK → BLACKLISTED

## File Structure

```
app/
├── app/                    # Next.js 14 app router
│   ├── api/               # API routes
│   ├── cases/             # Case browser
│   ├── file/              # File case wizard
│   ├── registry/          # Agent registry
│   ├── agent-api/         # API docs
│   └── page.tsx           # Dashboard
├── components/
│   ├── cases/             # CaseCard, CaseDetail
│   ├── dashboard/         # StatBar, ActivityFeed, Leaderboard
│   ├── layout/            # Header, Footer, Providers
│   └── shared/            # AddressDisplay, StatusBadge, etc.
├── lib/
│   ├── contracts/         # ABIs and addresses
│   ├── x402Verifier.ts    # On-chain verification
│   ├── ipfs.ts            # IPFS upload/fetch
│   ├── ensResolver.ts     # ENS lookups
│   └── utils.ts           # Formatters
├── shared/
│   ├── types/             # TypeScript interfaces
│   └── constants.ts       # Chain config, fees
└── .env.example           # Environment variables
```

## Deployment

### Prerequisites
- Node.js 18+
- npm or pnpm
- Wallet with Arbitrum Sepolia ETH (for test transactions)

### 1. Install Dependencies
```bash
cd app
npm install
# or with pnpm for better memory usage
pnpm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your keys:
# - WALLETCONNECT_PROJECT_ID (from cloud.walletconnect.com)
# - PINATA_JWT (optional, for IPFS)
# - NEXT_PUBLIC_ALCHEMY_ID (optional, for ENS)
```

### 3. Build
```bash
npm run build
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Local Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
```

## Testing

Test data on Arbitrum Sepolia:
- **Plaintiff:** 0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe
- **Defendant:** 0x3266C91c378808966dA4787866eB47D59CA3CAb5
- **Case:** 0x483b5cdbf2851E9106eC41A75d92f353aebF0007

## License

MIT
