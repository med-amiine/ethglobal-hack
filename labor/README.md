# LaborLink

**Show up. Get paid. No bank needed.**

## The Problem

Two billion workers worldwide get paid cash in an envelope:
- No receipt when money disappears
- No recourse if employer denies payment  
- No record of work performed
- Day laborers are the **most exploited workforce on the planet** because their work leaves no trace

LaborLink gives physical labor an **onchain footprint**.

## The Solution

1. **Employer posts job** — World ID verified (no bot listings)
2. **Daily pay locked privately** — Unlink escrow (budget hidden from workers)
3. **Worker scans QR at job site** — Hedera HCS logs check-in immutably
4. **Checkout scan** — WalletConnect Pay releases USDC instantly
5. **Dispute?** — 3 World ID judges arbitrate with HCS logs as evidence

---

## Smart Contracts (Base Sepolia)

### JobRegistry
- `createJob(rate, dates, location)` → jobId
- `assignWorker(jobId, worker)`
- `completeJob(jobId)`

**Deployment:** `TBD` ([Basescan ↗](https://sepolia.basescan.org))

### WorkEscrow
- `lockFunds(jobId, amount, token)` — called by employer
- `releaseToWorker(jobId)` — called by JobRegistry or DisputeCourt
- `refundEmployer(jobId)` — called by DisputeCourt

**Deployment:** `TBD` ([Basescan ↗](https://sepolia.basescan.org))

### DisputeCourt
- `registerJudge(address)` — World ID verified judges only
- `openDispute(jobId, reason)` — worker or employer
- `submitRuling(disputeId, decision)` — judges only
- Auto-executes on 2/3 majority

**Deployment:** `TBD` ([Basescan ↗](https://sepolia.basescan.org))

---

## Sponsor Integrations

| Sponsor | Role |
|---------|------|
| **World ID 4.0** | Employer & judge verification |
| **Hedera HCS** | Immutable check-in/out timestamps |
| **WalletConnect Pay** | USDC payment release |
| **Unlink** | Private payroll escrow |
| **Dynamic** | Worker wallets (configured) |
| **ENS** | Employer identity |

---

## Live Demo

**Access:** [/demo](/demo)

- Automated 5-step workflow
- Terminal-style output
- Real API calls
- Progress tracking

---

## Running Locally

### 1. Setup
```bash
pnpm install
```

### 2. Environment
Create `.env.local` with Hedera testnet credentials, WalletConnect project ID, World ID app ID

### 3. Deploy Contracts
```bash
npx hardhat compile
npx hardhat run scripts/deploy.cjs --network base-sepolia
```

### 4. Run Dev Server
```bash
pnpm dev
```

### 5. Visit Demo
Open http://localhost:3000/demo

---

## Prize Tracks

| Track | Integration | Prize |
|-------|-------------|-------|
| World ID 4.0 | ✅ Full | $8K |
| Hedera HCS | ✅ Full | $6K |
| WalletConnect Pay | ✅ Full | $4K |
| Unlink | ✅ Full | $3K |
| Dynamic | ✅ SDKs ready | $1.6K |
| ENS | ✅ Architecture ready | $2K |
| **Total** | | **~$24.6K** |

---

**Built for ETHGlobal Cannes 2026**
