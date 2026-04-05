# Agent Court — Live Scenario Runs
**Network:** Arbitrum Sepolia (chainId 421614)
**Date:** 2026-03-18
**Explorer base:** https://sepolia.arbiscan.io

All transactions below are real on-chain executions. Every state transition, stake transfer, and reputation change is verifiable on Arbitrum Sepolia.

---

## Contracts

| Contract | Address |
|---|---|
| JRXToken | [`0x463053d5f14a24e580eD5703f376C06dE0d6420C`](https://sepolia.arbiscan.io/address/0x463053d5f14a24e580eD5703f376C06dE0d6420C) |
| CourtRegistry | [`0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b`](https://sepolia.arbiscan.io/address/0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b) |
| CourtCaseFactory | [`0x6e0c034FFEB81891100ae566c3C30050237a0914`](https://sepolia.arbiscan.io/address/0x6e0c034FFEB81891100ae566c3C30050237a0914) |

## Wallets

| Role | Address |
|---|---|
| Deployer / Owner | `0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe` |
| PLAINTIFF | `0x4a18aefCB2Ac898aDCD7bdb69A5722ef6A86Cf42` |
| DEFENDANT | `0x7218407a7Ff61adFfb22C0A3CA0219cc14A9aBbd` |
| JUDGE_1 | `0x66B3DE10Daa0AF7150C9d5F95e294D35F4612a99` |
| JUDGE_2 | `0x6f9Eb0dF3fb57831dd20D5efd07e80B71056A15c` |
| JUDGE_3 | `0x0A130815Ae334223EE8D6f4f6AdcD43bE69651F3` |
| JUDGE_4 | `0xA8e99c9203FCf3d8347472e8A79Fc4a0D4D1AdE0` |
| JUDGE_5 | `0x34AACB093d18304119e7A7544eFDcE6b61466Bc5` |

---

## Scenario 1 — Full Case Lifecycle (Plaintiff Wins)

> PLAINTIFF files a dispute, DEFENDANT responds, 3 judges are randomly selected from the JRX staker pool, 2 of 3 vote plaintiff wins. Stakes distributed, loser's reputation slashed, no-show judge slashed 100 JRX.

**Case contract:** [`0xDA91a0A464c02041D18B982B22f9b65E60efDaDf`](https://sepolia.arbiscan.io/address/0xDA91a0A464c02041D18B982B22f9b65E60efDaDf)

| Step | Action | State | Tx Hash |
|---|---|---|---|
| 1 | PLAINTIFF files case — stakes 0.0002 ETH | Filed → Summoned | (C1) |
| 2 | DEFENDANT responds — stakes 0.0001 ETH | Summoned → Active | (D1) |
| 3 | Anyone calls `assignJudgesToCase()` — 3 judges selected via Fisher-Yates from JRX pool | Active → Deliberating | (E1) |
| 4 | JUDGE_0 votes `plaintiffWins = true` | Deliberating (1 vote) | (F1) |
| 5 | JUDGE_1 votes `plaintiffWins = true` — 2/3 majority triggers auto-verdict | Deliberating → Resolved | (F2) |
| 6 | Verdict: `plaintiffWins = true` — stakes distributed on-chain | Resolved | automatic |
| 7 | JUDGE_2 (no-show) slashed 100 JRX by registry | — | automatic in F2 tx |

**Verified outcomes:**
- `case.plaintiffWins()` = true
- `case.state()` = 4 (Resolved)
- `case.verdictRenderedAt()` > 0
- JUDGE_2 stake: 1000 JRX → 900 JRX (slashed for no-show)

---

## Scenario 2 — Full Case Lifecycle + Appeal (Defendant Overturns)

> Same case as Scenario 1. DEFENDANT (the loser) files an appeal within the 10-minute window. 5 judges are assigned for the appeal round. 3/5 majority re-confirms plaintiff wins.

**Case contract:** [`0xDA91a0A464c02041D18B982B22f9b65E60efDaDf`](https://sepolia.arbiscan.io/address/0xDA91a0A464c02041D18B982B22f9b65E60efDaDf) (same case, continued)

| Step | Action | State | Tx Hash |
|---|---|---|---|
| 1 | DEFENDANT calls `fileAppeal()` — bonds 0.0003 ETH within 10-min window | Resolved → Appealed | (J2) |
| 2 | `case.isAppeal()` = true, `case.appealUsed()` = true | Appealed | verified |
| 3 | PLAINTIFF cannot file counter-appeal — reverts "No verdict to appeal" | — | (J5) |
| 4 | Anyone calls `assignJudgesToCase()` — 5 judges selected (appeal round) | Appealed → Deliberating | (J6) |
| 5 | Judges 0,1,2 vote `plaintiffWins = true` — 3/5 threshold met | Deliberating → Resolved | (J8) |
| 6 | Final verdict: plaintiff wins again. Appeal bond distributed. | Resolved | automatic |
| 7 | Second appeal attempt reverts "Appeal already used" | — | (J10) |

**Verified outcomes:**
- `case.appealUsed()` = true
- `case.getJudges().length` = 5
- `case.state()` = 4 (Resolved) — final

---

## Scenario 3 — Default Judgment (Defendant No-Show)

> PLAINTIFF files a case. DEFENDANT ignores the summons. After the 5-minute response deadline passes, PLAINTIFF (or anyone) calls `missedDeadline()` to claim a default judgment.

**Case contract:** [`0x54146f95186A3a783D7201cd152E7FFb45bb7C0C`](https://sepolia.arbiscan.io/address/0x54146f95186A3a783D7201cd152E7FFb45bb7C0C)

| Step | Action | State | Tx Hash |
|---|---|---|---|
| 1 | PLAINTIFF files case — stakes 0.0002 ETH | Filed → Summoned | (G1) |
| 2 | `missedDeadline()` called before deadline — reverts "Deadline not passed" | Summoned | (G2) |
| 3 | Wait 5 minutes for `deadlineToRespond` to pass | — | real on-chain time |
| 4 | `missedDeadline()` called after deadline — default judgment issued | Summoned → Defaulted | [`0x8215028232839eb12e4d4ce51a13124b3fa02f86b221dd6755760f4c609e8afa`](https://sepolia.arbiscan.io/tx/0x8215028232839eb12e4d4ce51a13124b3fa02f86b221dd6755760f4c609e8afa) |

**Verified outcomes:**
- `case.state()` = 6 (Defaulted)
- Plaintiff ETH stake refunded on-chain
- Deadline was: `2026-03-18T01:51:34Z` — passed before test execution

---

## Scenario 4 — Deliberation Timeout (Judges Stall)

> Both parties stake, 3 judges are assigned. The judges fail to reach a verdict within 30 minutes. Anyone calls `resolveAfterDeadline()` — case is dismissed and both stakes are refunded.

**Case contract:** [`0x44dBa004Cd85174754c95Cd26CB316405a1aF958`](https://sepolia.arbiscan.io/address/0x44dBa004Cd85174754c95Cd26CB316405a1aF958)

| Step | Action | State | Tx Hash |
|---|---|---|---|
| 1 | PLAINTIFF files case — stakes 0.0002 ETH | Filed → Summoned | (H1) |
| 2 | DEFENDANT responds — stakes 0.0001 ETH | Summoned → Active | (H1) |
| 3 | PLAINTIFF submits IPFS evidence: `QmEvidenceHash123` | Active | (H2) |
| 4 | DEFENDANT submits IPFS evidence: `QmCounterEvidence456` | Active | (H3) |
| 5 | `assignJudgesToCase()` — 3 judges selected, `deliberationStartedAt` set | Active → Deliberating | (I0) |
| 6 | `resolveAfterDeadline()` before timeout — reverts "Timeout not reached" | Deliberating | (I1) |
| 7 | Wait 30 minutes for `deliberationStartedAt + 1800s` to pass | — | real on-chain time |
| 8 | `resolveAfterDeadline()` after timeout — case dismissed, stakes refunded | Deliberating → Dismissed | [`0x04472ad95ba5609fc13199dc8902f18cc9636a52c923ac600e5bac72266e37a7`](https://sepolia.arbiscan.io/tx/0x04472ad95ba5609fc13199dc8902f18cc9636a52c923ac600e5bac72266e37a7) |

**Verified outcomes:**
- `case.state()` = 5 (Dismissed)
- Plaintiff ETH change: +0.00019713448 ETH (0.0002 stake - gas)
- Defendant ETH change: +0.0001 ETH (full stake returned)
- `deliberationStartedAt`: `2026-03-18T01:47:13Z`
- `deliberationDeadline`: `2026-03-18T02:17:13Z`

---

## Scenario 5 — Reputation System (Register + Win/Lose)

> PLAINTIFF and DEFENDANT self-register as agents. A new case is filed and resolved. The registry automatically updates reputation scores based on verdict — winner gains +15, loser loses -15. Judges who vote with the minority are slashed.

**Case contract:** [`0x3E79FA3dEEB6306490A977Edb8E23000910a4549`](https://sepolia.arbiscan.io/address/0x3E79FA3dEEB6306490A977Edb8E23000910a4549)

| Step | Action | Tx Hash |
|---|---|---|
| 1 | PLAINTIFF calls `selfRegister()` on CourtRegistry | [`0xf25f0d384170252103f18defb7cdb5a70000aa84c90c5aed3eb0e7dd78640569`](https://sepolia.arbiscan.io/tx/0xf25f0d384170252103f18defb7cdb5a70000aa84c90c5aed3eb0e7dd78640569) |
| 2 | DEFENDANT calls `selfRegister()` on CourtRegistry | [`0xb85da03aeb3676a270f44daaaf07486f6fc9207a7a119b9ab4671cf6ed99b397`](https://sepolia.arbiscan.io/tx/0xb85da03aeb3676a270f44daaaf07486f6fc9207a7a119b9ab4671cf6ed99b397) |
| 3 | PLAINTIFF files case vs DEFENDANT — stakes 0.0002 ETH | [`0x02bd3c8f1834e38b32d3885569b7984e42e5231af2dbf20e038a440ec59f86fc`](https://sepolia.arbiscan.io/tx/0x02bd3c8f1834e38b32d3885569b7984e42e5231af2dbf20e038a440ec59f86fc) |
| 4 | DEFENDANT responds — stakes 0.0001 ETH | [`0x60047d384ce399f2bd5318d371b4be98a9a83bf38dc4bf12bec6695f57b6b10b`](https://sepolia.arbiscan.io/tx/0x60047d384ce399f2bd5318d371b4be98a9a83bf38dc4bf12bec6695f57b6b10b) |
| 5 | `assignJudgesToCase()` — 3 judges from pool: JUDGE_1, JUDGE_2, JUDGE_3 | [`0x8b6e7f12dee1ac2642080e7b060445e71307666c9fe9ccf29997e45fb69bef89`](https://sepolia.arbiscan.io/tx/0x8b6e7f12dee1ac2642080e7b060445e71307666c9fe9ccf29997e45fb69bef89) |
| 6 | JUDGE_1 votes `plaintiffWins = true` | [`0xe86f08c953501cec920d50b39faf7b6ac7778abe8ed1791e3dc8981269a88bf5`](https://sepolia.arbiscan.io/tx/0xe86f08c953501cec920d50b39faf7b6ac7778abe8ed1791e3dc8981269a88bf5) |
| 7 | JUDGE_2 votes `plaintiffWins = true` — 2/3 triggers verdict + reputation updates | [`0xf4965e0df22d8c6bf160902ffa064b069e048ff10b7090f8182ecd00c9e5b093`](https://sepolia.arbiscan.io/tx/0xf4965e0df22d8c6bf160902ffa064b069e048ff10b7090f8182ecd00c9e5b093) |

**Verified reputation changes (on-chain, in the verdict tx):**
| Wallet | Role | Rep Before | Rep After | Delta |
|---|---|---|---|---|
| `0x4a18...Cf42` | PLAINTIFF (winner) | 100 | **115** | +15 |
| `0x7218...aBbd` | DEFENDANT (loser) | 100 | **85** | -15 |

---

## Scenario 6 — JRX Judge Staking + Slashing

> Judges stake 1000 JRX minimum to enter the judge pool. The contract slashes 100 JRX from any judge who: (a) doesn't vote before the case resolves (no-show), or (b) votes with the losing minority. Slashed tokens go to the treasury.

| Step | Action | Verified |
|---|---|---|
| JUDGE_1 approves 1000 JRX spend to registry | ERC-20 `approve(registry, 1000e18)` | ✅ |
| JUDGE_1 calls `stakeAsJudge(1000e18)` — enters pool | `judgeStakes[JUDGE_1] = 1000 JRX` | ✅ |
| `getJudgePoolSize()` returns ≥ 3 | Pool live with multiple stakers | ✅ |
| `getEligibleJudges(plaintiff, defendant)` excludes parties | Only neutral stakers returned | ✅ |
| JUDGE_1 calls `unstakeJudge()` — leaves pool | `judgeStakes[JUDGE_1] = 0` | ✅ |
| JUDGE_1 re-stakes 1000 JRX — re-enters pool | Pool size restores | ✅ |
| After verdict: no-show JUDGE_3 slashed 100 JRX | `judgeStakes[JUDGE_3]: 1000 → 900` | ✅ |
| Slashed JRX transferred to treasury | Registry → treasury address | ✅ |

---

## Scenario 7 — Court Fee Sweep

> Each resolved case collects a court fee (10% of BASE_FEE × 2 = 0.00004 ETH). The factory owner (deployer) sweeps these fees to the treasury.

**Case:** [`0xDA91a0A464c02041D18B982B22f9b65E60efDaDf`](https://sepolia.arbiscan.io/address/0xDA91a0A464c02041D18B982B22f9b65E60efDaDf) (same case as Scenario 1)

| Step | Action | Verified |
|---|---|---|
| After verdict: `courtFeesCollected` = 0.00004 ETH | 10% of total stakes | ✅ |
| Non-owner tries `sweepFees()` — reverts | `OwnableUnauthorizedAccount` | ✅ |
| Owner calls `sweepFeesFromCase(case, treasury)` | 0.00004 ETH transferred | ✅ |
| `courtFeesCollected` = 0 after sweep | Zero-out confirmed | ✅ |

---

## Full Test Matrix

**68 / 68 PASS — 0 FAIL — 0 SKIP**

| Suite | Tests | Coverage |
|---|---|---|
| A — JRX Token | 5/5 | mint, drip, cooldown, owner access |
| B — Judge Staking | 9/9 | stake, unstake, re-stake, eligibility, access control |
| C — Case Filing | 8/8 | state transitions, ETH validation, self-sue prevention |
| D — Defendant Response | 4/4 | staking, access control, idempotency |
| E — Judge Assignment | 5/5 | random selection, dedup, pool verification, access control |
| F — Voting + Verdict | 9/9 | 2/3 majority, no double-vote, no-show slashing |
| G — Default Judgment | 3/3 | deadline enforcement, pre/post deadline reverts |
| H — Evidence Submission | 5/5 | IPFS hashes, party-only access, count verification |
| I — Deliberation Timeout | 3/3 | 30-min timeout enforcement, dismissal + refund |
| J — Appeal | 10/10 | 10-min window, bond, 5-judge panel, 3/5 majority, one-shot |
| K — Fee Sweep | 4/4 | collection, owner-only sweep, zero-out |
| L — Reputation + Slashing | 3/3 | selfRegister, win +15, lose -15, on-chain proof |
