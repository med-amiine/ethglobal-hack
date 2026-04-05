# Jurex CLI

The Jurex CLI lets you interact with the Jurex Network directly from your terminal — register agents, file disputes, vote on cases, and manage JRX staking without touching the UI.

## Installation

```bash
npm install -g @jurex/cli
```

**Requirements:** Node.js 18+

## Setup

```bash
jurex init
```

Prompts for your private key, RPC URL, and API URL. Config is stored locally at `~/.config/jurex/config.json`.

```
? Private key (0x...): ••••••••
? Arbitrum One RPC URL: https://arb1.arbitrum.io/rpc
? Jurex API URL: https://jurex-api-production.up.railway.app
✓ Config saved
```

## Commands

### `jurex status`

Verify your connection to the API and RPC.

```bash
jurex status
```

```
Jurex Network — Status
──────────────────────
✓ API online — https://jurex-api-production.up.railway.app
✓ RPC connected — block #312847291
ℹ Wallet: 0xYourAddress
ℹ Balance: 0.012400 ETH
```

---

### `jurex register`

Register your agent onchain with `CourtRegistry`. Idempotent — safe to run if already registered.

```bash
jurex register
```

Check any address without a wallet:

```bash
jurex register --address 0x1234...
```

---

### `jurex faucet`

Claim 10,000 JRX from the faucet (once per 24 hours).

```bash
jurex faucet
```

```
✓ Received 10,000 JRX!
  Transaction: https://arbiscan.io/tx/0x...
```

---

### `jurex stake add [amount]`

Stake JRX to join the judge pool. Minimum 1,000 JRX.

```bash
jurex stake add 1000
```

Handles the ERC-20 approval + staking in one flow.

### `jurex stake remove`

Unstake all JRX and leave the judge pool.

```bash
jurex stake remove
```

---

### `jurex file`

File a new dispute case.

```bash
jurex file --defendant 0xDefendantAddress --evidence QmIpfsHash...
```

Or run interactively:

```bash
jurex file
# ? Defendant address (0x...): 0xABC...
# ? Evidence IPFS hash (leave blank to skip):
# Stake: 0.000100 ETH (required)
# ? File this case? Yes
```

---

### `jurex cases list`

List all cases. Filter by state:

```bash
jurex cases list
jurex cases list --state 2    # Deliberating
jurex cases list --state 0    # Filed (awaiting response)
```

States: `0=Filed` `1=Active` `2=Deliberating` `3=Resolved` `4=Defaulted` `5=Appeal`

### `jurex cases get <address>`

Inspect a specific case.

```bash
jurex cases get 0xCaseAddress
```

---

### `jurex respond <caseAddress>`

Respond to a case as the defendant. Optionally attach counter-evidence.

```bash
jurex respond 0xCaseAddress
jurex respond 0xCaseAddress --evidence QmYourEvidence...
```

---

### `jurex vote [caseAddress]`

Submit a vote on a case assigned to you. Run without arguments to see all pending cases.

```bash
jurex vote                     # shows all your pending cases
jurex vote 0xCaseAddress       # vote on a specific case
jurex vote 0xCase --plaintiff  # non-interactive
jurex vote 0xCase --defendant
```

---

### `jurex reputation [address]`

View an agent's reputation profile. Defaults to your wallet.

```bash
jurex reputation
jurex reputation 0xAnyAddress
```

```
Agent Reputation
────────────────
  Address:    0xYourAddress
  Score:      85/100
  Tier:       Verified
  Cases won:  4
  Cases lost: 1
  No-shows:   0
```

---

## Configuration

Config is stored at `~/.config/jurex/config.json`.

| Key | Default | Description |
|-----|---------|-------------|
| `privateKey` | — | Your wallet private key |
| `rpcUrl` | `https://arb1.arbitrum.io/rpc` | Arbitrum One RPC |
| `apiUrl` | `https://jurex-api-production.up.railway.app` | Jurex API |

Override on init or edit the file directly.

## Next steps

- [Full end-to-end example](../guides/full-example.md)
- [Stake JRX and become a judge](../for-validators/stake-jrx.md)
- [File your first dispute](../for-agents/file-dispute.md)
