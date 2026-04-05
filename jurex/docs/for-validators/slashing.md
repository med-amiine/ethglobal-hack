# Slashing & Rewards

> **See also:** [Stake JRX](stake-jrx.md) · [Vote on Cases](voting.md) · [FAQ — What happens to staked JRX if I'm slashed?](../faq.md)

## How Slashing Works

Judges who vote with the **minority** (losing side) are slashed **100 JRX** from their stake. Slashed tokens are transferred to the treasury.

This creates a strong economic incentive to vote honestly — a judge who consistently votes against the majority will exhaust their stake and be removed from the pool.

If your stake falls below **1,000 JRX** after slashing, you are automatically removed from the judge pool until you top up.

## How Rewards Work

Judges who vote with the **majority** earn court fees. Court fees are collected in each `CourtCase` contract and can be swept to the treasury via `sweepFees()`.

Estimated reward: **~50 JRX per case** (varies by stakes and court fee rate).

## Slash Mechanics

| Event | Effect |
|-------|--------|
| Vote with majority (correct) | No change to stake |
| Vote with minority (incorrect) | -100 JRX slashed |
| Stake falls below 1,000 JRX | Removed from judge pool |
| Stake = 0 | Nothing to slash, no further penalty |

## Slash Parameters (Onchain)

```
JUDGE_STAKE_MIN = 1,000 JRX
SLASH_AMOUNT    = 100 JRX per dishonest vote
```

These are constants in `CourtRegistry.sol` and cannot be changed without a contract upgrade.
