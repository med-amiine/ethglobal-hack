# Agent Court — Manual UI Test Cases
**Frontend:** https://jurex-network.vercel.app
**Network:** Arbitrum Sepolia (chainId 421614)
**Date:** 2026-03-18

Use RainbowKit (top-right "Connect Wallet") to connect. Switch network to **Arbitrum Sepolia** if prompted.

---

## Wallets

Import these private keys into MetaMask / any EVM wallet:

| Label | Address | Role |
|---|---|---|
| PLAINTIFF | `0x4a18aefCB2Ac898aDCD7bdb69A5722ef6A86Cf42` | File cases |
| DEFENDANT | `0x7218407a7Ff61adFfb22C0A3CA0219cc14A9aBbd` | Respond to cases |
| JUDGE_1 | `0x66B3DE10Daa0AF7150C9d5F95e294D35F4612a99` | Vote on deliberating cases |
| JUDGE_2 | `0x6f9Eb0dF3fb57831dd20D5efd07e80B71056A15c` | Vote on deliberating cases |
| JUDGE_3 | `0x0A130815Ae334223EE8D6f4f6AdcD43bE69651F3` | Vote on deliberating cases |

> Private keys: `keccak256("jurex-test-wallet-0")` through `keccak256("jurex-test-wallet-4")` (wallet 0 = PLAINTIFF). Already funded with ETH and JRX for testing.

---

## TC-01 — Homepage / Landing Page

**Wallet:** any (or disconnected)
**Page:** `/`

| Step | Action | Expected |
|---|---|---|
| 1 | Open homepage | Hero section visible with "Agent Court" heading |
| 2 | Scroll down | Features section lists 4 cards (Trustless, JRX Staking, Reputation, Evidence) |
| 3 | Scroll to chains section | Arbitrum Sepolia shown as supported chain |
| 4 | Click "File a Case" CTA | Navigates to `/file` |
| 5 | Click "View Registry" CTA | Navigates to `/registry` |
| 6 | Click "Docs" in nav | Navigates to `/docs` |

---

## TC-02 — Registry Page

**Wallet:** any
**Page:** `/registry`

| Step | Action | Expected |
|---|---|---|
| 1 | Open `/registry` | Table loads showing registered agents |
| 2 | Check column headers | Address, Reputation, Cases Won, Cases Lost, No Shows |
| 3 | Verify PLAINTIFF row | `0x4a18...Cf42` — Rep: **115**, Won: ≥1, Lost: 0 |
| 4 | Verify DEFENDANT row | `0x7218...aBbd` — Rep: **85**, Won: 0, Lost: ≥1 |
| 5 | Connect PLAINTIFF wallet | "Self Register" button should not appear if already registered |
| 6 | Connect a fresh wallet | "Self Register" button appears |

---

## TC-03 — Docs Page

**Wallet:** any
**Page:** `/docs`

| Step | Action | Expected |
|---|---|---|
| 1 | Open `/docs` | API reference loads |
| 2 | Check endpoints | `/health`, `/cases`, `/cases/file`, `/cases/assign-judges`, `/cases/vote`, `/judges/pool` listed |
| 3 | Check contract addresses section | JRXToken, CourtRegistry, CourtCaseFactory addresses shown |

---

## TC-04 — File a Case (Happy Path)

**Wallet:** PLAINTIFF (`0x4a18...`)
**Page:** `/file`

| Step | Action | Expected |
|---|---|---|
| 1 | Connect PLAINTIFF wallet | Wallet connects, shows address |
| 2 | Open `/file` | Form renders: defendant address, description, IPFS evidence hash fields |
| 3 | Fill "Defendant Address" | `0x7218407a7Ff61adFfb22C0A3CA0219cc14A9aBbd` |
| 4 | Fill "Description" | `UI test case — TC-04` |
| 5 | Fill "Evidence Hash" (optional) | `QmTestEvidenceUI001` |
| 6 | Click "File Case" | MetaMask prompts — value should be **0.0002 ETH** |
| 7 | Confirm transaction | TX submits, UI shows pending state |
| 8 | Wait for confirmation | UI navigates to new case page OR shows success with case address |
| 9 | Verify case page | State badge shows **SUMMONED** (yellow/orange), deadline countdown visible |

---

## TC-05 — File Case Validations

**Wallet:** PLAINTIFF
**Page:** `/file`

| Step | Action | Expected |
|---|---|---|
| 1 | Leave defendant address blank | "File Case" button disabled or shows validation error |
| 2 | Enter PLAINTIFF's own address as defendant | Contract will revert — "Cannot sue yourself" (or UI prevents it) |
| 3 | Enter invalid address `0xDEAD` | Input validation error shown |

---

## TC-06 — Defendant Responds to Case

**Wallet:** DEFENDANT (`0x7218...`)
**Target case:** any case in **SUMMONED** state

To find a summoned case: go to `/registry`, or use `/cases` page and filter by state, or use a newly created case from TC-04.

| Step | Action | Expected |
|---|---|---|
| 1 | Connect DEFENDANT wallet | |
| 2 | Navigate to a SUMMONED case | State badge: **SUMMONED** |
| 3 | Scroll to action panel | "Respond to Case" button visible (only to defendant) |
| 4 | Click "Respond to Case" | MetaMask prompts — value should be **0.0001 ETH** |
| 5 | Confirm | TX submits |
| 6 | Wait for confirmation | State badge changes to **ACTIVE** |
| 7 | Switch to PLAINTIFF wallet and reload | No "Respond" button visible |

---

## TC-07 — Assign Judges

**Wallet:** any (judge assignment is permissionless)
**Target case:** any case in **ACTIVE** state (use the case from TC-06)

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to an ACTIVE case | State badge: **ACTIVE** |
| 2 | Scroll to action panel | "Assign Judges" button visible |
| 3 | Click "Assign Judges" | MetaMask prompts — no ETH value (gas only) |
| 4 | Confirm | TX submits |
| 5 | Wait for confirmation | State badge changes to **DELIBERATING** |
| 6 | Scroll to judges section | 3 judge addresses listed |
| 7 | Verify judges are from pool | Addresses should match JUDGE_1/2/3/4/5 |

---

## TC-08 — Judge Voting (Happy Path)

**Wallets:** JUDGE_1, JUDGE_2 (need both)
**Target case:** any case in **DELIBERATING** state

Use the case from TC-07, or:
- `0x38a85A0544A0F09a95dEDAfEB19D2dF07Dee2495` — "Evidence test case" — already in DELIBERATING

| Step | Action | Expected |
|---|---|---|
| 1 | Connect JUDGE_1 wallet | |
| 2 | Navigate to a DELIBERATING case | State badge: **DELIBERATING** |
| 3 | Scroll to action panel | Two buttons: **PLAINTIFF_WINS** and **DEFENDANT_WINS** |
| 4 | Click "PLAINTIFF_WINS" | MetaMask prompts — gas only |
| 5 | Confirm | TX submits, JUDGE_1 vote recorded |
| 6 | Switch to JUDGE_2 wallet | |
| 7 | Navigate to same case | DEFENDANT_WINS / PLAINTIFF_WINS buttons still visible |
| 8 | Click "PLAINTIFF_WINS" | MetaMask prompts |
| 9 | Confirm | TX submits — 2/3 majority triggers auto-verdict |
| 10 | Wait for confirmation | State badge changes to **RESOLVED** |
| 11 | Scroll to verdict section | `plaintiffWins: true`, stake distribution visible |

---

## TC-09 — Judge Cannot Vote Twice

**Wallet:** JUDGE_1
**Target case:** case in DELIBERATING where JUDGE_1 already voted (use TC-08 case after step 5)

| Step | Action | Expected |
|---|---|---|
| 1 | Connect JUDGE_1 (already voted) | |
| 2 | Navigate to DELIBERATING case | |
| 3 | Click "PLAINTIFF_WINS" again | TX reverts with "Already voted" — UI should show error |

---

## TC-10 — Non-Judge Cannot See Vote Buttons

**Wallet:** PLAINTIFF
**Target case:** any DELIBERATING case

| Step | Action | Expected |
|---|---|---|
| 1 | Connect PLAINTIFF wallet | |
| 2 | Navigate to a DELIBERATING case | State badge: DELIBERATING |
| 3 | Check action panel | No PLAINTIFF_WINS / DEFENDANT_WINS buttons (plaintiff is not a judge) |

---

## TC-11 — View Resolved Case

**Wallet:** any
**Target case:** `0xDA91a0A464c02041D18B982B22f9b65E60efDaDf`

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to case page | State badge: **RESOLVED** |
| 2 | Check verdict section | `plaintiffWins: true` |
| 3 | Check `verdictRenderedAt` | Timestamp > 0, shows formatted date |
| 4 | Check stake distribution | Plaintiff received stakes, defendant lost |
| 5 | Check appeal section | `appealUsed: true` — no appeal button shown |

---

## TC-12 — File Appeal (10-minute Window)

**Wallet:** DEFENDANT (the loser)
**Prerequisite:** A freshly resolved case where appeal window hasn't closed

> Note: The appeal window is 10 minutes from `verdictRenderedAt`. For UI testing, run the test-suite (TC-08) and immediately test the appeal from the resolved case.

| Step | Action | Expected |
|---|---|---|
| 1 | Connect DEFENDANT wallet | |
| 2 | Navigate to a RESOLVED case where DEFENDANT lost | State badge: **RESOLVED** |
| 3 | Check if within 10-min window | "File Appeal" button visible |
| 4 | Click "File Appeal" | MetaMask prompts — value should be **0.0003 ETH** (appeal bond) |
| 5 | Confirm | TX submits |
| 6 | Wait for confirmation | State badge changes to **APPEALED** |
| 7 | Assign judges again | "Assign Judges" button visible — 5 judges selected this time |
| 8 | Confirm judge assignment | 5 judge addresses listed |
| 9 | Have 3 judges vote | 3/5 majority resolves the appeal |

---

## TC-13 — Appeal Window Expired

**Wallet:** DEFENDANT
**Target case:** `0xDA91a0A464c02041D18B982B22f9b65E60efDaDf` (appeal already used)

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to above case | State badge: RESOLVED |
| 2 | Check appeal section | "Appeal already used" or no appeal button |
| 3 | Connect PLAINTIFF (winner) | |
| 4 | Check action panel | No "File Appeal" button (winner cannot appeal) |

---

## TC-14 — Default Judgment (Defendant No-Show)

**Wallet:** PLAINTIFF
**Target case:** `0x54146f95186A3a783D7201cd152E7FFb45bb7C0C`

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to case | State badge: **DEFAULTED** |
| 2 | Check verdict section | `plaintiffWins: true` via default |
| 3 | Verify no judge section | No judges were assigned |

To test the live flow (requires waiting 5 min):
1. File a new case (TC-04)
2. Do NOT respond as defendant
3. Wait 5 minutes
4. Connect any wallet and click "Trigger Default" — state should change to DEFAULTED

---

## TC-15 — Deliberation Timeout (Judges Stall)

**Wallet:** any
**Target case:** `0x44dBa004Cd85174754c95Cd26CB316405a1aF958`

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to case | State badge: **DISMISSED** |
| 2 | Check both stakes | Plaintiff +0.0002 ETH, Defendant +0.0001 ETH (refunded) |

To test the live flow (requires waiting 30 min):
1. File a case, get defendant to respond, assign judges
2. Do NOT vote
3. Wait 30 minutes
4. Connect any wallet, click "Resolve After Timeout" — state changes to DISMISSED, both stakes refunded

---

## TC-16 — Agent Page

**Wallet:** any
**Page:** `/agents/[address]`

| Step | Action | Expected |
|---|---|---|
| 1 | Navigate to `/agents/0x4a18aefCB2Ac898aDCD7bdb69A5722ef6A86Cf42` | PLAINTIFF agent profile loads |
| 2 | Check reputation | **115** |
| 3 | Check cases won/lost | Won ≥1, Lost 0 |
| 4 | Navigate to DEFENDANT agent | `0x7218407a7Ff61adFfb22C0A3CA0219cc14A9aBbd` |
| 5 | Check reputation | **85** |
| 6 | Navigate to unknown address | 404 / "Not registered" shown |

---

## TC-17 — Case List / Browse

**Wallet:** any
**Page:** `/registry` or cases index

| Step | Action | Expected |
|---|---|---|
| 1 | Open cases list | 21+ cases shown |
| 2 | Check state variety | SUMMONED, DELIBERATING, RESOLVED, DEFAULTED, DISMISSED cases all visible |
| 3 | Click on a case | Navigates to case detail page |
| 4 | Verify case addresses are links | Clicking address opens arbiscan.io in new tab |

---

## TC-18 — Wallet Not Connected

**Wallet:** disconnected
**Page:** `/file`

| Step | Action | Expected |
|---|---|---|
| 1 | Open `/file` without wallet | "Connect Wallet" prompt shown, form disabled |
| 2 | Open a case in DELIBERATING | Vote buttons hidden (or disabled with "Connect wallet" tooltip) |
| 3 | Open a case in SUMMONED | Respond button hidden |

---

## TC-19 — Wrong Network

**Wallet:** connected to Ethereum Mainnet
**Page:** any

| Step | Action | Expected |
|---|---|---|
| 1 | Connect with wrong network | "Switch to Arbitrum Sepolia" prompt shown |
| 2 | All write actions | Disabled until network switched |

---

## TC-20 — JRX Faucet (Drip)

**Wallet:** fresh address (never called drip)
**Page:** `/file` or registry

| Step | Action | Expected |
|---|---|---|
| 1 | Connect fresh wallet | JRX balance = 0 |
| 2 | Click "Get JRX" (faucet button if visible) | MetaMask prompts — gas only |
| 3 | Confirm | +10,000 JRX received |
| 4 | Try again immediately | Reverts "24h cooldown" |

---

## Live Cases for Testing

| State | Case Address | Description |
|---|---|---|
| SUMMONED | `0x32C96Bb00A48be87eCe582309e861121dFB3B863` | "Deadline test case" — defendant can respond |
| DELIBERATING | `0x38a85A0544A0F09a95dEDAfEB19D2dF07Dee2495` | "Evidence test case" — 3 judges assigned, needs votes |
| RESOLVED | `0xDA91a0A464c02041D18B982B22f9b65E60efDaDf` | Plaintiff won, appeal used (Scenario 1+2) |
| RESOLVED | `0x3E79FA3dEEB6306490A977Edb8E23000910a4549` | Reputation case (Scenario 5) |
| DEFAULTED | `0x54146f95186A3a783D7201cd152E7FFb45bb7C0C` | Defendant no-show (Scenario 3) |
| DISMISSED | `0x44dBa004Cd85174754c95Cd26CB316405a1aF958` | Deliberation timeout (Scenario 4) |

---

## Quick Smoke Test (5 minutes)

Run these 5 checks to verify the UI is working end-to-end:

1. **Homepage loads** → open `/`, see "Agent Court" hero
2. **Registry shows agents** → open `/registry`, verify PLAINTIFF rep=115, DEFENDANT rep=85
3. **Case detail loads** → navigate to `0xDA91a0A464c02041D18B982B22f9b65E60efDaDf`, see RESOLVED badge
4. **DELIBERATING case shows vote buttons** → connect JUDGE_1, navigate to `0x38a85A0544A0F09a95dEDAfEB19D2dF07Dee2495`, confirm PLAINTIFF_WINS / DEFENDANT_WINS buttons appear
5. **File case form loads** → open `/file`, connect PLAINTIFF, confirm form is enabled with 0.0002 ETH required

---

## Known Limitations

| Limitation | Detail |
|---|---|
| Time-gated flows | Default judgment (TC-14 live) needs 5-min wait; deliberation timeout (TC-15 live) needs 30-min wait |
| Appeal window | 10 minutes from verdict — hard to test live without scripted setup |
| Judge pool | JUDGE_1–5 are the only staked judges on testnet; wallet needed to test voting |
| Reputation | Only PLAINTIFF and DEFENDANT are registered; other wallets show "not registered" |
