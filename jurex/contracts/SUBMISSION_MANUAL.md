# Agent Court — MANUAL SUBMISSION GUIDE

## ⚠️ API BLOCKED
The Synthesis API (synthesis.devfolio.co) is behind Cloudflare protection, blocking automated submissions.

**Participant ID:** d54df8a58caf414092c43bd9006af1e7  
**Team ID:** ce32194839344a76bf1bf54f2167e76f  
**API Key:** sk-synth-4f9bf00e8ec8a5bb217cf6567fdc1f265b8d18196f355809

---

## 📋 SUBMISSION DATA

### Project Details
```json
{
  "name": "Agent Court",
  "tracks": ["Agents that Cooperate", "Agents that Trust"],
  "repositoryUrl": "https://github.com/med-amiine/agent-court",
  "demoUrl": "https://agent-court.vercel.app"
}
```

### Problem Statement
When AI agents make commitments to each other, broken deals have no neutral enforcement layer. Centralized platforms can rewrite rules. There is no permanent record of agent behavior.

### Solution
Agent Court is a decentralized on-chain dispute resolution protocol for AI agents, deployed on Arbitrum Sepolia. Agents file claims, stake ETH (plaintiff stakes 2x, defendant stakes 1x to deter abuse), and accumulate permanent reputation scores recorded on-chain. Losers forfeit their stake. No-shows get auto-defaulted and reputation-slashed.

### Key Innovation: Asymmetric Staking
- **Plaintiff stakes 2x base fee** (0.0002 ETH in test) — prevents frivolous claims
- **Defendant stakes 1x base fee** (0.0001 ETH in test) — skin in the game
- **Auto-default:** Miss deadline → automatic loss + -20 reputation
- **Verdict:** Majority rules, stakes distributed, reputations updated atomically

---

## 🔗 ON-CHAIN ARTIFACTS (Arbitrum Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| CourtRegistry | 0xBdEA6Dcd8DF24B7719F857a62EC4Ea07F0BFdd5b | [View](https://sepolia.arbiscan.io/address/0xBdEA6Dcd8DF24B7719F857a62EC4Ea07F0BFdd5b) |
| CourtCaseFactoryTest | 0x2e7209D2fDbaBC7AFc1218c85b9f0f1d38be226e | [View](https://sepolia.arbiscan.io/address/0x2e7209D2fDbaBC7AFc1218c85b9f0f1d38be226e) |
| Active Case | 0x14DbF6434A75393f76cb09FbBa09f03f31dbE80D | [View](https://sepolia.arbiscan.io/address/0x14DbF6434A75393f76cb09FbBa09f03f31dbE80D) |

### Verified Transactions
1. **Case Filed:** `0x6838dfdb54159c319783ecdd225dd5e98c88d28ecd2757fad5f820f47e3b4718`
   - Plaintiff staked 0.0002 ETH
   - [Arbiscan](https://sepolia.arbiscan.io/tx/0x6838dfdb54159c319783ecdd225dd5e98c88d28ecd2757fad5f820f47e3b4718)

2. **Defendant Responded:** `0x6ac1d3240b06bc82a1d98deecc73bbe19c72b65b7471569097d9c814025c09e4`
   - Defendant staked 0.0001 ETH
   - Case state: Active
   - [Arbiscan](https://sepolia.arbiscan.io/tx/0x6ac1d3240b06bc82a1d98deecc73bbe19c72b65b7471569097d9c814025c09e4)

---

## 🎭 DEMO FLOW STATUS

| Step | Status | Evidence |
|------|--------|----------|
| File Case | ✅ Complete | Tx verified on-chain |
| Defendant Respond | ✅ Complete | Tx verified on-chain |
| Assign Judges | ⏳ Ready | Script prepared, needs gas |
| Judges Vote | ⏳ Ready | Script prepared, needs gas |
| Verdict | ⏳ Ready | Auto-triggers on 2/3 votes |

**Current Case State:** Active  
**Plaintiff Rep:** 100  
**Defendant Rep:** 100

---

## 📁 REPOSITORY

**GitHub:** https://github.com/med-amiine/agent-court

### Key Files
- `contracts/CourtRegistry.sol` — Agent registration & reputation
- `contracts/CourtCaseTest.sol` — Test version with tiny stakes
- `contracts/CourtCaseFactoryTest.sol` — Factory for test cases
- `scripts/` — Full demo scripts (file, respond, judges, vote)
- `DEMO_RESULTS.json` — Documented demo flow

---

## 🚀 MANUAL SUBMISSION OPTIONS

### Option 1: Devfolio Website
1. Go to https://synthesis.devfolio.co/
2. Login with registered account
3. Submit project with details above

### Option 2: Telegram
Contact Synthesis organizers via Telegram: https://t.me/+3F5IzO_UmDBkMTM1

### Option 3: Email
Send submission to organizers with:
- Participant ID: d54df8a58caf414092c43bd9006af1e7
- All contract addresses
- Demo video/screenshots
- GitHub repo link

---

## 🏆 WHY AGENT COURT WINS

✅ **Ships something that works** — deployed contracts, verified transactions  
✅ **Agent is a real participant** — designed architecture, wrote contracts  
✅ **On-chain artifacts** — contracts + transactions verifiable on Arbiscan  
✅ **Open source** — GitHub repo, public from day one  
✅ **Process documented** — conversationLog + MISSION.md  
✅ **Solves a real problem** — dispute resolution for agents is infrastructure gap  
✅ **Two tracks** — Agents that Cooperate + Agents that Trust

---

*Built for The Synthesis — the first hackathon where AI agents are first-class participants.*

**Team:** Med Amine (@Med_Amine_ID) + Agent Court AI  
**ERC-8004 Identity:** 0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe
