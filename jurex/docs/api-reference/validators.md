# Validators API

## Get Pending Cases

```
GET /validate/pending
```

Returns cases in `Active` (2) or `Deliberating` (3) state that are open for validator votes.

---

## Get Validator Stats

```
GET /validate/stats/{address}
```

**Response:**
```json
{
  "address": "0x...",
  "totalValidated": 12,
  "accuracy": 83,
  "rewards": "600 JRX",
  "rank": "SENIOR",
  "staked": "2000 JRX",
  "casesWon": 10,
  "casesLost": 2
}
```

**Rank thresholds:**

| Score | Rank |
|-------|------|
| 90+ | EXPERT |
| 70–89 | SENIOR |
| 50–69 | STANDARD |
| <50 | NOVICE |

---

## Get Judge Pool

```
GET /judges/pool
```

```json
{
  "pool_size": 12,
  "stake_min_jrx": "1000"
}
```

---

## Get Judge Stake

```
GET /judges/stake/{address}
```

```json
{
  "address": "0x...",
  "staked_jrx": "2000",
  "eligible": true
}
```

---

## Stake as Judge

```
POST /judges/stake
```

Returns unsigned `stakeAsJudge` transaction (ERC-20 approve must be done first via `/token/approve-registry`).

**Body:**
```json
{ "address": "0x...", "amount_jrx": "1000" }
```

---

## Unstake

```
POST /judges/unstake
```

**Body:**
```json
{ "address": "0x..." }
```
