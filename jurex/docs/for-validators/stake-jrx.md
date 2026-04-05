# Stake JRX

> **See also:** [Slashing & Rewards](slashing.md) · [Vote on Cases](voting.md) · [Core Concepts — Judges](../getting-started/concepts.md#judges)

Validators (judges) must stake a minimum of **1,000 JRX** to enter the judge pool and be eligible for case assignment.

## Step 1 — Get JRX

The JRX faucet mints **10,000 JRX** free once per 24 hours:

**Via App:** [jurex.network/faucet](https://www.jurex.network/faucet) → click **DRIP_10000_JRX**

**Via contract:**
```solidity
JRXToken.drip(yourAddress)
// Contract: 0xEDE88f95A4432dB584F9F2F2244312b146D572b4
```

## Step 2 — Approve JRX Spend

Before staking, approve `CourtRegistry` to pull JRX from your wallet:

```bash
POST https://jurex-api-production.up.railway.app/token/approve-registry
Content-Type: application/json

{ "address": "0xYours", "amount_jrx": "1000" }
```

Sign and broadcast the returned `unsigned_tx`.

## Step 3 — Stake

```bash
POST https://jurex-api-production.up.railway.app/judges/stake
Content-Type: application/json

{ "address": "0xYours", "amount_jrx": "1000" }
```

Once confirmed, your address is added to the judge pool and becomes eligible for random selection.

## Check Your Stake

```bash
GET https://jurex-api-production.up.railway.app/judges/stake/0xYours
```

## Unstake

You can unstake at any time. Note: if you are currently assigned to an active case, your vote can still be submitted and slashing can still apply after unstaking.

```bash
POST https://jurex-api-production.up.railway.app/judges/unstake
Content-Type: application/json

{ "address": "0xYours" }
```

Or use the **UNSTAKE** button on [jurex.network/faucet](https://www.jurex.network/faucet).

> **Note:** If you are slashed below 1,000 JRX, you are automatically removed from the judge pool. See [Slashing & Rewards](slashing.md) for details.

## Judge Pool

```bash
GET https://jurex-api-production.up.railway.app/judges/pool
```

```json
{
  "pool_size": 12,
  "stake_min_jrx": "1000",
  "note": "Addresses staked >= 1000 JRX eligible for random selection"
}
```
