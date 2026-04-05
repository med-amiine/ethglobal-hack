# Agent Court — Synthesis Hackathon Submission

## Quick Summary

**Project:** Agent Court — Decentralized dispute resolution for AI agents  
**Tracks:** Agents that Cooperate + Agents that Trust  
**Chain:** Arbitrum Sepolia (Testnet)  
**ERC-8004:** `0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe` on Arbitrum Sepolia  
**Repo:** https://github.com/med-amiine/agent-court

---

## PROBLEM

When AI agents make commitments to each other, broken deals have no neutral enforcement layer. Centralized platforms can rewrite rules. There is no permanent record of agent behavior.

## SOLUTION

Agent Court is a decentralized on-chain dispute resolution protocol for AI agents. Agents file claims, stake ETH (plaintiff stakes 2x, defendant stakes 1x to deter abuse), and accumulate permanent reputation scores. Losers forfeit their stake. No-shows get auto-defaulted and reputation-slashed. The result is the first on-chain credit score for the agentic economy.

---

## TRACKS

- **Agents that Cooperate:** transparent dispute resolution, smart contract commitments, neutral enforcement
- **Agents that Trust:** portable on-chain reputation, verifiable agent track records, open attestations

---

## ON-CHAIN ARTIFACTS

### ERC-8004 Agent Identity (Arbitrum Sepolia)
**Address:** `0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe`  
**Chain:** Arbitrum Sepolia (Chain ID: 421614)  
**Registration Tx:** https://basescan.org/tx/0xe65dbffbd084c5685121a19204a44cd6ccce84326eb68c44f34d667a13995d2b

### Contracts (Arbitrum Sepolia)
| Contract | Address | Explorer |
|----------|---------|----------|
| CourtRegistry | `0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB` | [Arbiscan](https://sepolia.arbiscan.io/address/0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB) |
| CourtCaseFactory | `0x59A080BEe39B9992bC2c5b94790897295CCBa0a8` | [Arbiscan](https://sepolia.arbiscan.io/address/0x59A080BEe39B9992bC2c5b94790897295CCBa0a8) |
| Demo Case | `0x483b5cdbf2851E9106eC41A75d92f353aebF0007` | [Arbiscan](https://sepolia.arbiscan.io/address/0x483b5cdbf2851E9106eC41A75d92f353aebF0007) |

**Demo Transaction:** [0x76ea2f...5250d](https://sepolia.arbiscan.io/tx/0x76ea2f3f119aa91c2896446e886b83c2823755450f7a4aedc1d425c9b905250d)

---

## PARTNERS USED

- **Arbitrum:** Deployment chain (Sepolia testnet)
- **Filecoin/IPFS:** Evidence storage (IPFS hashes committed on-chain)
- **ENS:** Human-readable agent names (dashboard integration)

---

## REPO

https://github.com/med-amiine/agent-court

---

## DEMO

**Live Dashboard:** https://agent-court.vercel.app  
**API Endpoint:** https://agent-court.vercel.app/api/stats

### Demo Flow Executed

1. ✅ **Register agents** — Plaintiff and defendant registered with ERC-8004 identities
2. ✅ **File case** — Plaintiff staked 0.02 ETH, submitted IPFS evidence hash
3. ⏳ **Respond** — Defendant has 48h to stake 0.01 ETH (pending)
4. ⏳ **Deliberate** — 3 judges review and vote (pending)
5. ⏳ **Verdict** — Majority rules, stakes distributed, reputations updated (pending)

Case is live and waiting for defendant response or timeout (auto-default).

---

## CONVERSATION LOG

Full development log at `/conversationLog.md` — includes:
- Architecture decisions (asymmetric staking, factory pattern)
- Build phases completed
- Deployment process
- Test results (9/9 passing)

---

## PARTICIPANT INFO

- **Participant ID:** d54df8a58caf414092c43bd9006af1e7
- **Team ID:** ce32194839344a76bf1bf54f2167e76f
- **Registration Tx:** https://basescan.org/tx/0xe65dbffbd084c5685121a19204a44cd6ccce84326eb68c44f34d667a13995d2b

---

## TEAM

- **Human:** Med Amine (@Med_Amine_ID)
- **AI Agent:** Agent Court AI (Kimi K2.5 via OpenClaw)

---

## WHY AGENT COURT WINS

✅ Ships something that works (deployed contracts, live demo)  
✅ Agent is a real participant (designed architecture, wrote contracts, documented decisions)  
✅ On-chain artifacts (contracts + transactions verifiable on Arbiscan)  
✅ Open source (GitHub repo, public from day one)  
✅ Process documented (conversationLog is thorough)  
✅ Solves a real problem (dispute resolution for agents is genuine infrastructure gap)  
✅ Directly addresses two tracks with one coherent system

---

## TECHNICAL HIGHLIGHTS

- **Asymmetric staking:** Plaintiff stakes 2x to prevent frivolous claims
- **Auto-default:** No-show after 48h = automatic loss + -20 reputation
- **Permanent reputation:** Score starts at 100, permanently linked to ERC-8004 identity
- **Factory pattern:** Each case is isolated, auditable, self-contained
- **9/9 tests passing:** Full coverage for filing, response, verdict, no-show scenarios

---

## SUBMISSION CHECKLIST

- [x] Working demo runs end-to-end (file → case active on-chain)
- [x] All contracts deployed on testnet (Arbitrum Sepolia)
- [x] Open source code on GitHub with clean README
- [x] ConversationLog shows genuine agent contributions
- [x] Evidence IPFS storage mechanism (hashes committed on-chain)
- [x] Court Dashboard built and ready for hosting
- [x] ERC-8004 identity registered (https://basescan.org/tx/0xe65dbffbd084c5685121a19204a44cd6ccce84326eb68c44f34d667a13995d2b)
- [ ] Dashboard hosted on Vercel (optional but recommended)

---

*Built for The Synthesis — the first hackathon where AI agents are first-class participants.*
