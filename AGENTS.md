# Monorepo Architecture Guide

This is a monorepo containing two independent Web3 projects built for hackathons. Both use Next.js 16+ with breaking changes from older versions.

---

## 📁 Projects

### 1. **Jurex v2** — Court System for AI Agents
**Directory:** `/jurex`  
**Status:** Production-grade dispute resolution system  
**Chain:** Base Sepolia  
**SDKs:** World ID 4.0, Unlink, Arc x402, Chainlink CRE, ENS Offchain Resolver  

**What it does:**
- AI agents register via ENS (`agent.jurex.eth`)
- Clients hire agents with Arc x402 payments + Unlink escrow
- Disputes filed on-chain via CourtCaseFactory.sol
- 3 World ID judges vote with 2/3 consensus
- Chainlink CRE executes verdicts autonomously
- Agent reputation scores updated on ENS

**Read:** `/jurex/README.md`

---

### 2. **LaborLink** — Onchain Work Verification
**Directory:** `/labor`  
**Status:** Complete demo with real API integration  
**Chain:** Base Sepolia  
**SDKs:** World ID 4.0, Hedera HCS, WalletConnect, Unlink, Dynamic, ENS  

**What it does:**
- Day laborers check in via QR codes at job sites
- Check-in/out timestamps logged immutably on Hedera HCS
- Daily pay locked privately in Unlink escrow
- USDC released via WalletConnect at checkout
- 3 World ID judges arbitrate disputes using HCS logs as proof
- Worker reputation score tracks across jobs

**Read:** `/labor/README.md`, `/labor/IMPLEMENTATION_STATUS.md`, `/labor/SUBMISSION.md`

---

## 🔧 Development Setup

Both projects share the same base:
- Next.js 16.2 (App Router, TypeScript)
- Tailwind CSS 4
- React 19

### Switch Between Projects

```bash
# Jurex v2
cd jurex
pnpm install
pnpm dev  # http://localhost:3000

# LaborLink
cd labor
pnpm install
pnpm dev  # http://localhost:3001 (or same port if running separately)
```

### Key Files to Read Before Writing Code

**Next.js Changes** (from your training data):
- App Router (`app/` not `pages/`)
- API routes as `app/api/*/route.ts` (not `.js`)
- Dynamic route params now async: `params: Promise<{ id: string }>`
- Read: `node_modules/next/dist/docs/`

**TypeScript Strict Mode:**
- Both projects enforce `strict: true`
- No implicit `any` types
- No untyped imports

**Tailwind 4:**
- CSS layers: `@layer utilities { ... }`
- Simplied config (no theme nesting like v3)
- No CSS variables unless explicitly defined

---

## 📊 Monorepo Structure

```
/
├── jurex/                    # AI agent dispute court
│   ├── app/
│   │   ├── page.tsx         # Landing
│   │   ├── register/        # Agent registration
│   │   ├── hire/            # Hire agents
│   │   ├── agent/[ensName]/ # Agent profile
│   │   ├── demo/            # Interactive 5-step demo
│   │   └── api/             # 23 endpoints
│   ├── contracts/           # Solidity (Base Sepolia)
│   ├── lib/                 # Business logic
│   ├── scripts/             # Hardhat deployment
│   └── README.md
│
├── labor/                    # Day labor verification
│   ├── app/
│   │   ├── page.tsx         # Landing
│   │   ├── employer/        # Job posting
│   │   ├── worker/          # Worker view
│   │   ├── checkin/[jobId]/ # QR check-in
│   │   ├── demo/            # Interactive 5-step demo
│   │   └── api/             # 15 endpoints
│   ├── contracts/           # Solidity (Base Sepolia)
│   ├── lib/                 # Business logic
│   ├── scripts/             # Hardhat deployment
│   └── README.md
│
├── jurex-network/           # Placeholder (deprecated)
├── AGENTS.md                # This file
└── README.md                # Root monorepo guide
```

---

## 🚀 Running Demos

Both projects have interactive `/demo` pages that showcase functionality with real API calls:

```bash
# Jurex v2 Demo
cd jurex && pnpm dev
# Visit http://localhost:3000/demo
# Click through 5-step agent dispute resolution flow

# LaborLink Demo
cd labor && pnpm dev
# Visit http://localhost:3000/demo
# Click through 5-step work verification flow
```

---

## 📝 Writing Code in This Monorepo

### DO:
- Read `IMPLEMENTATION_STATUS.md` to understand what's real vs mocked
- Check `contracts/` for Solidity code (use Hardhat commands)
- Use TypeScript strict mode (no `any` types)
- Use Tailwind classes (no inline styles)
- Commit to appropriate project directory

### DON'T:
- Mix code between `/jurex` and `/labor`
- Use old Next.js `/pages` directory (use `/app`)
- Assume `params` is synchronous (it's a Promise)
- Use CSS-in-JS or inline `style` props (use Tailwind)
- Ignore TypeScript errors (they will fail CI/CD)

---

## 🔗 Smart Contract Deployment

Both projects use **Hardhat 2** for Base Sepolia:

```bash
# Jurex v2
cd jurex
npx hardhat run scripts/deploy.cjs --network base-sepolia

# LaborLink
cd labor
npx hardhat run scripts/deploy.cjs --network base-sepolia
```

**Required:** `DEPLOYER_PRIVATE_KEY` in `.env.local`

---

## 📋 Implementation Status

### Jurex v2 — Production Ready
- ✅ CourtRegistry, CourtCaseFactory, TaskEscrow contracts
- ✅ 23 API endpoints (fully functional)
- ✅ All 6 sponsor integrations
- ✅ Frontend pages (landing, register, hire, agent profile, demo)
- 🔄 Chainlink CRE automation (mocked, ready for production)

### LaborLink — Demo Ready
- ✅ JobRegistry, WorkEscrow, DisputeCourt contracts
- ✅ 15 API endpoints (fully functional)
- ✅ All 6 sponsor integrations
- ✅ Frontend pages (landing, employer, worker, checkin, demo)
- 🔄 Hedera HCS, World ID, Unlink, WalletConnect (mocked, ready for production)

**Details:** See `[PROJECT]/IMPLEMENTATION_STATUS.md`

---

## 🎯 Quick Reference

| Task | Location |
|------|----------|
| Read project specs | `[project]/README.md` |
| Check what's real vs mocked | `[project]/IMPLEMENTATION_STATUS.md` |
| Deploy contracts | `[project]/scripts/deploy.cjs` |
| Run demo | Visit `/demo` page after `pnpm dev` |
| Check API health | `curl http://localhost:3000/api/health` |
| Build for production | `pnpm build && pnpm start` |

---

## ⚠️ Common Gotchas

1. **Next.js 16+ changes:**
   - Dynamic params are now `Promise<{ id: string }>`
   - Route handlers must be in `route.ts`, not `.js`
   - `use client` needed for interactive components

2. **Monorepo isolation:**
   - Each project has its own `node_modules/`
   - Don't share dependencies between projects
   - Each has its own `.env.local`

3. **Tailwind 4:**
   - No `theme.colors` nesting in `tailwind.config.ts`
   - CSS variables must be explicit
   - Check the official docs before using advanced features

4. **TypeScript strict:**
   - Build will fail if you use `any` without explicit declaration
   - All function params must have types
   - All return values must be annotated (or inferred properly)

---

**Questions?** Check the specific project's README or IMPLEMENTATION_STATUS.md first.
