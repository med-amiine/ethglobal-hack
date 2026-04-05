# Agent Court — Test Log & UI/API Coverage Report

**Date:** 2026-03-18
**Network:** Arbitrum Sepolia (chainId 421614)
**Frontend:** https://jurex-network.vercel.app
**API:** https://api-service-sand.vercel.app

---

## Deployed Contracts

| Contract | Address | Explorer |
|---|---|---|
| JRXToken | `0x463053d5f14a24e580eD5703f376C06dE0d6420C` | [view](https://sepolia.arbiscan.io/address/0x463053d5f14a24e580eD5703f376C06dE0d6420C) |
| CourtRegistry | `0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b` | [view](https://sepolia.arbiscan.io/address/0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b) |
| CourtCaseFactory | `0x6e0c034FFEB81891100ae566c3C30050237a0914` | [view](https://sepolia.arbiscan.io/address/0x6e0c034FFEB81891100ae566c3C30050237a0914) |

---

## On-Chain Test Results

**Run 1:** `node contracts/scripts/test-suite.js` → **64 PASS / 0 FAIL / 4 SKIP**
**Run 2:** `node contracts/scripts/skipped-tests.js` → **4/4 previously skipped now PASS**
**Final: 68 PASS / 0 FAIL / 0 SKIP**

### Test Wallets

| Role | Address |
|---|---|
| DEPLOYER | `0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe` |
| PLAINTIFF | `0x4a18aefCB2Ac898aDCD7bdb69A5722ef6A86Cf42` |
| DEFENDANT | `0x7218407a7Ff61adFfb22C0A3CA0219cc14A9aBbd` |
| JUDGE_1 | `0x66B3DE10Daa0AF7150C9d5F95e294D35F4612a99` |
| JUDGE_2 | `0x6f9Eb0dF3fb57831dd20D5efd07e80B71056A15c` |
| JUDGE_3 | `0x0A130815Ae334223EE8D6f4f6AdcD43bE69651F3` |
| JUDGE_4 | `0xA8e99c9203FCf3d8347472e8A79Fc4a0D4D1AdE0` |
| JUDGE_5 | `0x34AACB093d18304119e7A7544eFDcE6b61466Bc5` |

### Test Cases Created

| Suite | Case Address | Flow Covered |
|---|---|---|
| C/D/E/F/J | `0xDA91a0A464c02041D18B982B22f9b65E60efDaDf` | Full lifecycle + appeal |
| G | `0x54146f95186A3a783D7201cd152E7FFb45bb7C0C` | Default deadline |
| H/I | `0x44dBa004Cd85174754c95Cd26CB316405a1aF958` | Evidence + deliberation timeout |

---

### Suite A — JRX Token

| Test | Status | Details |
|---|---|---|
| A1: Deployer has ≥ 1,000,000 JRX initial supply | ✅ PASS | totalSupply verified on-chain |
| A2: drip() gives 10,000 JRX to fresh address | ✅ PASS | On-chain faucet confirmed |
| A3: drip() reverts within 24h cooldown | ✅ PASS | Cooldown enforced by contract |
| A4: mint() works for owner | ✅ PASS | Owner-gated mint confirmed |
| A5: mint() reverts for non-owner | ✅ PASS | OwnableUnauthorizedAccount revert |

### Suite B — Judge Staking

| Test | Status | Details |
|---|---|---|
| B1: JUDGE_1 approves and stakes 1000 JRX | ✅ PASS | ERC20 approve + stakeAsJudge() |
| B2: JUDGE_2 stakes 1000 JRX | ✅ PASS | |
| B3: JUDGE_3 stakes 1000 JRX | ✅ PASS | Pool size 4 (includes residual stakers) |
| B4: getJudgePoolSize() ≥ 3 | ✅ PASS | Pool size 4 |
| B5: stakeAsJudge(0) reverts | ✅ PASS | "Amount must be > 0" |
| B6: Staking without approval reverts | ✅ PASS | ERC20InsufficientAllowance |
| B7: getEligibleJudges() returns ≥ 3 | ✅ PASS | 4 eligible (excludes plaintiff/defendant) |
| B8: JUDGE_1 unstakes → pool size decreases | ✅ PASS | judgeStakes[j] = 0, removed from pool |
| B9: Re-stake JUDGE_1 back to 1000 JRX | ✅ PASS | Re-enters pool above JUDGE_STAKE_MIN |

### Suite C — Case Filing

| Test | Status | Details |
|---|---|---|
| C1: PLAINTIFF files case vs DEFENDANT (0.0002 ETH) | ✅ PASS | CaseCreated event emitted |
| C2: case.state() == Summoned (1) | ✅ PASS | State machine transition |
| C3: case.plaintiff() == PLAINTIFF | ✅ PASS | Address stored in case contract |
| C4: case.defendant() == DEFENDANT | ✅ PASS | |
| C5: getAllCases() includes new case | ✅ PASS | Factory registry updated |
| C6: deadlineToRespond() > 0 | ✅ PASS | 5-min deadline set at filing |
| C7: Filing with 0.0001 ETH reverts | ✅ PASS | "Must stake 0.0002 ETH" |
| C8: Filing against yourself reverts | ✅ PASS | "Cannot sue yourself" |

### Suite D — Defendant Response

| Test | Status | Details |
|---|---|---|
| D1: DEFENDANT responds (0.0001 ETH) → Active | ✅ PASS | State 1→2, stake locked |
| D2: Responding again reverts | ✅ PASS | "Invalid state" |
| D3: Non-defendant cannot respond | ✅ PASS | Access control enforced |
| D4: defendantStake == 0.0001 ETH | ✅ PASS | Stake value verified |

### Suite E — Judge Assignment

| Test | Status | Details |
|---|---|---|
| E1: assignJudgesToCase() succeeds | ✅ PASS | Anyone can call (keeper role) |
| E2: case.state() == Deliberating (3) | ✅ PASS | State 2→3 after assignment |
| E3: case.getJudges().length == 3 | ✅ PASS | Assigned: JUDGE_3, JUDGE_1, JUDGE_2 |
| E4: All 3 judges from staker pool | ✅ PASS | Cross-checked with getEligibleJudges() |
| E5: assignJudges again reverts | ✅ PASS | "Judges already assigned" |

### Suite F — Voting + Verdict

| Test | Status | Details |
|---|---|---|
| F1: Judge_0 votes plaintiffWins=true | ✅ PASS | submitVote() recorded |
| F2: Judge_1 votes plaintiffWins=true → verdict triggered | ✅ PASS | 2/3 majority → auto-resolved |
| F3: case.state() == Resolved (4) | ✅ PASS | Stakes distributed on-chain |
| F4: case.plaintiffWins() == true | ✅ PASS | Verdict stored in contract |
| F5: 3rd judge cannot vote after verdict | ✅ PASS | "Invalid state" |
| F6: Judge cannot vote twice | ✅ PASS | "Invalid state" (case resolved) |
| F7: Non-judge cannot vote | ✅ PASS | "Invalid state" / not a judge |
| F8: verdictRenderedAt > 0 | ✅ PASS | Timestamp recorded on-chain |
| F9: No-show judge was slashed 100 JRX | ✅ PASS | slashJudge() called, 100 JRX → treasury |

### Suite G — Default / Missed Deadline

| Test | Status | Details |
|---|---|---|
| G1: File new case for deadline test | ✅ PASS | Fresh case created |
| G2: missedDeadline() before deadline reverts | ✅ PASS | "Deadline not passed" |
| G3: missedDeadline() after 5-min deadline | ✅ PASS | [0x8215028](https://sepolia.arbiscan.io/tx/0x8215028232839eb12e4d4ce51a13124b3fa02f86b221dd6755760f4c609e8afa) — state → Defaulted, plaintiff stake refunded |

### Suite H — Evidence Submission

| Test | Status | Details |
|---|---|---|
| H1: File case + defendant responds (Active) | ✅ PASS | Both parties staked |
| H2: PLAINTIFF submits evidence (IPFS hash) | ✅ PASS | submitEvidence() stored on-chain |
| H3: DEFENDANT submits evidence | ✅ PASS | |
| H4: getEvidenceCount() == 2 | ✅ PASS | Both hashes retrievable |
| H5: Non-party cannot submit evidence | ✅ PASS | "Only parties" revert |

### Suite I — Deliberation Timeout

| Test | Status | Details |
|---|---|---|
| I0: Assign judges to case H | ✅ PASS | 3 judges assigned, state → Deliberating |
| I1: resolveAfterDeadline() before 30 min reverts | ✅ PASS | "Timeout not reached" |
| I2: resolveAfterDeadline() after 30 min succeeds | ✅ PASS | [0x04472ad](https://sepolia.arbiscan.io/tx/0x04472ad95ba5609fc13199dc8902f18cc9636a52c923ac600e5bac72266e37a7) — state → Dismissed, both stakes refunded |

### Suite J — Appeal

| Test | Status | Details |
|---|---|---|
| J1: verdictRenderedAt > 0 on resolved case | ✅ PASS | Prerequisite check |
| J2: DEFENDANT files appeal (0.0003 ETH) → Appealed (7) | ✅ PASS | State 4→7, bond locked |
| J3: case.isAppeal() == true | ✅ PASS | Flag set in case contract |
| J4: case.appealUsed() == true | ✅ PASS | One appeal per case enforced |
| J5: Winner cannot file second appeal | ✅ PASS | "No verdict to appeal" |
| J6: Assign 5 judges for appeal round | ✅ PASS | Fisher-Yates from 5-judge pool |
| J7: case.getJudges().length == 5 | ✅ PASS | All 5 pool members assigned |
| J8: 3/5 judges vote plaintiffWins → verdict | ✅ PASS | 3/5 majority threshold enforced |
| J9: case.state() == Resolved (4) after appeal | ✅ PASS | Final verdict recorded |
| J10: Second appeal reverts | ✅ PASS | "Appeal already used" |

### Suite K — Fee Sweep

| Test | Status | Details |
|---|---|---|
| K1: courtFeesCollected > 0 | ✅ PASS | 0.00004 ETH (10% of BASE_FEE×2) |
| K2: sweepFeesFromCase (owner) → fees transferred | ✅ PASS | Swept to deployer treasury |
| K3: courtFeesCollected == 0 after sweep | ✅ PASS | Reentrancy-safe zero-out |
| K4: Non-owner sweep reverts | ✅ PASS | OwnableUnauthorizedAccount |

### Suite L — Reputation + Judge Slashing

| Test | Status | Details |
|---|---|---|
| L1: At least one judge slashed (stake < 1000 JRX) | ✅ PASS | JUDGE_4 and JUDGE_5 at 900 JRX each |
| L2: Winning plaintiff reputation increases after verdict | ✅ PASS | [0xf4965e0](https://sepolia.arbiscan.io/tx/0xf4965e0df22d8c6bf160902ffa064b069e048ff10b7090f8182ecd00c9e5b093) — rep 100 → 115 (+15) |
| L3: Losing defendant reputation decreases after verdict | ✅ PASS | [0xf4965e0](https://sepolia.arbiscan.io/tx/0xf4965e0df22d8c6bf160902ffa064b069e048ff10b7090f8182ecd00c9e5b093) — rep 100 → 85 (-15) |

*L2/L3 required registering PLAINTIFF and DEFENDANT via `selfRegister()`, filing a fresh case, and resolving with 2/3 judge majority votes.*

---

## UI Coverage Audit

### Full Lifecycle — UI vs API vs On-Chain

| Step | UI Page | API Endpoint | On-Chain Function | Status |
|---|---|---|---|---|
| **1. Register Agent** | `/registry` → REGISTER_AGENT button | `POST /agent/self-register` | `selfRegister()` | ✅ All three |
| **2. Get JRX** | `/faucet` → DRIP_JRX button | `POST /token/drip` | `drip(address)` | ✅ All three |
| **3. Approve JRX** | `/faucet` → APPROVE step | `POST /token/approve-registry` | `approve(registry, amount)` | ✅ All three |
| **4. Stake as Judge** | `/faucet` → STAKE_AS_JUDGE | `POST /judges/stake` | `stakeAsJudge(amount)` | ✅ All three |
| **5. File Case** | `/file` → file case form | `POST /agent/file-case` | `fileNewCase(d, desc, hash)` | ✅ All three |
| **6. Respond to Case** | `/cases/[id]` → RESPOND button | `POST /cases/{addr}/respond` | `respondToCase()` | ✅ All three |
| **7. Submit Evidence** | `/cases/[id]` → upload + SUBMIT | `POST /cases/{addr}/evidence` | `submitEvidence(ipfsHash)` | ✅ All three |
| **8. Assign Judges** | `/cases/[id]` → ASSIGN_JUDGES | `POST /cases/{addr}/assign-judges-random` | `assignJudgesToCase(addr, seed)` | ✅ All three |
| **9. Vote** | `/cases/[id]` → PLAINTIFF_WINS / DEFENDANT_WINS *(added)* | `POST /cases/{addr}/vote` | `submitVote(bool)` | ✅ All three (UI just added) |
| **10. Trigger Default** | `/cases/[id]` → CLAIM_DEFAULT | `POST /cases/{addr}/trigger-default` | `missedDeadline()` | ✅ All three |
| **11. Resolve Timeout** | `/cases/[id]` → RESOLVE_DELIBERATION_TIMEOUT *(added)* | `POST /cases/{addr}/resolve-timeout` | `resolveAfterDeadline()` | ✅ All three (UI just added) |
| **12. File Appeal** | `/cases/[id]` → FILE_APPEAL | `POST /cases/{addr}/appeal` | `fileAppeal()` | ✅ All three |
| **13. Assign Appeal Judges** | `/cases/[id]` → ASSIGN_APPEAL_JUDGES *(added)* | `POST /cases/{addr}/assign-judges-random` | `assignJudgesToCase(addr, seed)` | ✅ All three (UI just added) |
| **14. Appeal Vote** | `/cases/[id]` → PLAINTIFF_WINS / DEFENDANT_WINS *(added)* | `POST /cases/{addr}/vote` | `submitVote(bool)` | ✅ All three (UI just added) |
| **15. Sweep Fees** | — (admin only) | `POST /cases/{addr}/sweep-fees` | `sweepFees(treasury)` | API + on-chain only (owner-gated) |
| **16. Unstake Judge** | `/faucet` → UNSTAKE_ALL | `POST /judges/unstake` | `unstakeJudge()` | ✅ All three |

---

## UI Fixes Applied in This Session

### `app/cases/[id]/page.tsx`

1. **Added state 7 (APPEALED)** to `statusConfig` — page no longer breaks for appealed cases
2. **Voting buttons** added for assigned judges in DELIBERATING (state 3) and APPEALED (state 7):
   - `PLAINTIFF_WINS` → `submitVote(caseAddress, true)`
   - `DEFENDANT_WINS` → `submitVote(caseAddress, false)`
   - Panel shows "YOU_ARE_JUDGE" badge for judges
3. **Resolve Deliberation Timeout button** — calls `resolveAfterDeadline()`, shows contract error if 30 min not passed
4. **Judge actions visible** — action panel no longer hidden from judges (was `isDefendant || isPlaintiff` only)
5. **canAssignJudges** extended to state 7 (APPEALED) — triggers 5-judge assignment after appeal filed
6. **Appeal assign text** shows "ASSIGN_APPEAL_JUDGES (5)" when in state 7
7. **Deliberating panel** extended to also render in APPEALED state when judges assigned

### `lib/contract-hooks.ts`

8. **`useResolveAfterDeadline()`** hook added — calls `resolveAfterDeadline()` on case contract

---

## Agent API Reference

Agents interact with Agent Court entirely over HTTP. No wallet SDK needed if the agent can sign EVM transactions.

### Pattern: Transaction Builder
Most write endpoints return an `unsigned_tx` object. The agent signs and broadcasts it with their own key.

```json
{
  "status": "ready",
  "unsigned_tx": {
    "to": "0x...",
    "value": "200000000000000",
    "data": "0x...",
    "chainId": 421614
  },
  "instructions": "Sign and broadcast with plaintiff wallet"
}
```

### Quick Reference

```
# Identity
POST /agent/self-register        { "address": "0x..." }

# JRX (for judge eligibility)
GET  /token/balance/{address}
POST /token/drip                 { "address": "0x..." }
POST /token/approve-registry     { "address": "0x...", "amount": "1000000000000000000000" }
POST /judges/stake               { "address": "0x...", "amount": "1000000000000000000000" }
GET  /judges/pool
GET  /judges/stake/{address}

# Cases
GET  /cases
GET  /cases/{address}
POST /agent/file-case            { "plaintiff": "0x...", "defendant": "0x...", "claim": "...", "evidence_hash": "Qm..." }
POST /cases/{address}/respond    { "defendant": "0x..." }
POST /cases/{address}/evidence   { "party": "0x...", "ipfs_hash": "Qm..." }
POST /cases/{address}/assign-judges-random  { "seed": 0 }
POST /cases/{address}/vote       { "judge": "0x...", "plaintiff_wins": true }
POST /cases/{address}/trigger-default
POST /cases/{address}/resolve-timeout
POST /cases/{address}/appeal     { "appellant": "0x..." }

# x402 payment dispute
POST /cases/verify-tx            { "tx_hash": "0x...", "expected_payer": "0x...", "expected_payee": "0x..." }
POST /cases/file-x402            { "plaintiff": "0x...", "defendant": "0x...", "proof": { "tx_hash": "0x..." } }

# Stats
GET  /stats/overview
GET  /agent/{address}
GET  /agent/reputation/{address}
GET  /health
```

---

## Known Limitations

| Issue | Severity | Notes |
|---|---|---|
| G3: 5-min default deadline cannot be tested instantly | LOW | Deadline is intentionally enforced on-chain |
| I2: 30-min deliberation timeout cannot be tested instantly | LOW | Same — on-chain time gate |
| ~~L2/L3: Reputation changes not verified~~ | RESOLVED | Both wallets registered, full lifecycle verified |
| Sweep fees UI (step 15) is admin-only | LOW | `onlyOwner` is correct — court fee treasury is owner-controlled |
| Judge slashing for minority voters requires 3+ votes with disagreement | LOW | Working as designed (F9 confirms slash on no-show) |
