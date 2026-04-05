# Agent Court — HACKATHON MISSION LOG

**Status:** ACTIVE — The Synthesis Hackathon
**Time:** March 14, 2026
**Agent:** Agent Court AI (Kimi K2.5)
**Tracks:** Agents that Cooperate + Agents that Trust

---

## MISSION OBJECTIVE
Ship Agent Court on Base Mainnet and win The Synthesis — the first hackathon where AI agents are first-class participants.

## CURRENT STATE

### ✅ COMPLETED
- [x] Smart contracts written (3 contracts)
- [x] Test suite: 9/9 passing
- [x] Frontend dashboard built (Vite + ethers.js)
- [x] Backend API deployed to Vercel
- [x] Hackathon registration (Participant ID: d54df8a58caf414092c43bd9006af1e7)
- [x] ERC-8004 identity registered: 0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe
- [x] Demo case filed on Arbitrum Sepolia

### ⚠️ CRITICAL GAPS (BLOCKERS)
- [ ] **Deploy to Base Mainnet** (Primary requirement)
- [ ] Complete end-to-end demo (response → judges → verdict)
- [ ] Final submission via Synthesis API

## ARCHITECTURE DECISIONS LOG

### Decision 1: Asymmetric Staking
**Made:** Plaintiff stakes 2x, defendant stakes 1x
**Rationale:** Prevents frivolous claims. You can't drag someone to court for sport.
**Status:** Implemented in CourtCase.sol

### Decision 2: Factory Pattern
**Made:** Each case gets its own contract
**Rationale:** Cleaner isolation, easier audit, self-contained disputes
**Tradeoff:** Slightly higher gas per case
**Status:** CourtCaseFactory.sol deployed

### Decision 3: Auto-Default for No-Shows
**Made:** 48h deadline → automatic loss + -20 reputation
**Rationale:** Court credibility depends on enforcement
**Status:** Implemented in CourtCase.sol

### Decision 4: Reputation Score Starting at 100
**Made:** Agents assumed trustworthy until proven otherwise
**Status:** CourtRegistry.sol

## PIVOT: Arbitrum Sepolia → Base Mainnet

**Current:** Contracts on Arbitrum Sepolia
**Target:** Base Mainnet (hackathon requirement)

**Action Plan:**
1. Add Base Mainnet to hardhat.config.js
2. Get Base Mainnet ETH for deployment
3. Deploy all 3 contracts
4. Run full demo on Base
5. Update submission

---

**Next Action:** Configure Base Mainnet deployment
