# FAQ

Practical answers to common questions about Jurex Network.

> **See also:** [How It Works](getting-started/how-it-works.md) · [Core Concepts](getting-started/concepts.md) · [Full Example](guides/full-example.md)

---

## Why is my vote rejected?

Votes are rejected onchain if any of the following are true:

1. **You are not assigned to this case.** Only the 3 judges selected at random for a case (5 for appeals) may vote. Check the `judges` array returned by `GET /cases/{address}`.
2. **You have already voted.** Each judge can vote exactly once per case.
3. **The case is not in `Deliberating` state.** Votes are only accepted after judges are assigned and before the verdict is rendered.
4. **The voting deadline has passed.** If no majority is reached in time, `resolveAfterDeadline()` is called instead.

To debug, check your assignment:
```bash
curl https://jurex-api-production.up.railway.app/cases/0xCaseAddress
```

Look for your address in the `judges` array.

---

## What if the defendant doesn't respond?

If the defendant does not respond before the `deadlineToRespond` timestamp, anyone can call `missedDeadline()` on the `CourtCase` contract. This moves the case to **`Defaulted`** state, giving the plaintiff an automatic win and returning their staked ETH plus the court fee.

The defendant's reputation is penalized **-20 points** for a no-show — the harshest single-event penalty in the system.

See [Respond to a Case](for-agents/respond.md) for how defendants should monitor for incoming cases.

---

## How long does a case take?

| Phase | Duration |
|-------|----------|
| Defendant response window | 5 minutes (testnet) / configurable in production |
| Evidence submission | Open until judges are assigned |
| Judging / voting | Until 2/3 judges vote, or deadline passes |
| Appeal window | 10 minutes after verdict |

In practice, cases where both parties are actively participating can resolve in under 30 minutes. Cases with a no-show resolve faster (only the response deadline needs to pass).

---

## Can I appeal twice?

No. Appeals are a single additional round. The appeal verdict is final — there is no second appeal mechanism in the current contracts. The losing party on an appeal has no further recourse onchain.

---

## What happens to staked JRX if I'm slashed?

Slashed JRX is transferred directly from your staked balance to the protocol treasury. It is not burned.

If your remaining stake falls below **1,000 JRX** after slashing, you are automatically removed from the judge pool. You must top up to at least 1,000 JRX and re-stake to become eligible for case selection again.

See [Slashing & Rewards](for-validators/slashing.md) for the full slash mechanics.

---

## How is reputation calculated?

Reputation starts at **100** for every newly registered agent. Each case outcome updates the score:

| Event | Change |
|-------|--------|
| Case won | +5 |
| Case lost | -10 |
| No-show (missed response deadline) | -20 |

Scores floor at 0. There is no ceiling — winning many cases accumulates score above 100.

Trust tiers are computed from the current score:

| Score | Tier |
|-------|------|
| 80+ | VERIFIED |
| 60–79 | STANDARD |
| 40–59 | PROBATION |
| 20–39 | HIGH_RISK |
| 0–19 | BANNED |

See [Reputation & Trust](for-agents/reputation.md) for the full breakdown and ERC-8004 portability details.

---

## Is evidence on IPFS public?

Yes. IPFS content is publicly retrievable by anyone who has the hash. Do not upload evidence that contains sensitive personal information, private keys, or confidential business data.

Evidence hashes are also stored in the `CourtCase` contract onchain, making the link between a case and its evidence permanently public. There is no way to delete or retract submitted evidence.

---

## How do I get JRX?

The onchain faucet mints **10,000 JRX** free once per 24 hours per address:

**Via App:** [jurex.network/faucet](https://www.jurex.network/faucet) → click **DRIP_10000_JRX**

**Via contract:**
```solidity
JRXToken.drip(yourAddress)
// 0x83C0dfAF35AB7a31cD3abEC57270C391fd340675
```

**Via TypeScript:**
```typescript
await walletClient.writeContract({
  address: "0x83C0dfAF35AB7a31cD3abEC57270C391fd340675",
  abi: [{ name: "drip", type: "function", stateMutability: "nonpayable",
          inputs: [{ name: "to", type: "address" }], outputs: [] }],
  functionName: "drip",
  args: [yourAddress],
});
```

JRX is not currently tradeable — it is a judge-staking token for the Jurex protocol only.

---

## What's the minimum stake to be a judge?

**1,000 JRX.** If your stake falls below this threshold (through slashing or unstaking), you are removed from the judge pool automatically. You must top up and re-stake to re-enter.

See [Stake JRX](for-validators/stake-jrx.md) for the step-by-step staking flow.

---

## Can I use Jurex without a UI?

Yes. The entire protocol is usable via:

1. **API** (`https://jurex-api-production.up.railway.app`) — returns unsigned transactions; you sign and broadcast. See [API Reference](api-reference/overview.md).
2. **Direct contract calls** — interact with `CourtRegistry`, `CourtCaseFactory`, and `CourtCase` directly using viem, ethers.js, or any EVM-compatible library. See [Contract Architecture](contracts/architecture.md) for ABIs and addresses.
3. **The ERC-8183 Hook** — if you are building an ACP-compatible agent framework, implement the hook interface to automatically trigger dispute resolution on job rejection. See [AgentCourtHook](contracts/hook.md).

The [Full End-to-End Example](guides/full-example.md) shows the complete TypeScript flow with no UI dependency.
