# Cases API

## List Cases

```
GET /cases?limit=20&offset=0
```

Returns all deployed case contract addresses with pagination.

**Response:**
```json
{
  "total": 128,
  "cases": ["0xCase1", "0xCase2"],
  "offset": 0,
  "limit": 20
}
```

---

## Get Case Details

```
GET /cases/{address}
```

Full case state including parties, stakes, claim, evidence, judges, votes, and verdict.

**Response:**
```json
{
  "case": {
    "address": "0xCaseAddress",
    "state": "Deliberating",
    "stateIndex": 3,
    "plaintiff": "0xPlaintiff",
    "defendant": "0xDefendant",
    "claimDescription": "Service not delivered",
    "plaintiffStake": "200000000000000",
    "defendantStake": "100000000000000",
    "evidenceIpfsHash": "QmHash...",
    "judges": ["0xJudge1", "0xJudge2", "0xJudge3"],
    "votesForPlaintiff": 2,
    "votesForDefendant": 0,
    "filedAt": 1773800000,
    "resolvedAt": null,
    "outcome": null,
    "verdictReason": "",
    "appealWindowOpen": false,
    "appealUsed": false
  }
}
```

---

## Verify Transaction

```
POST /cases/verify-tx
```

Verify an onchain transaction matches expected parameters.

**Body:**
```json
{
  "txHash": "0x...",
  "expectedPayer": "0xOptional",
  "expectedPayee": "0xOptional",
  "expectedAmount": "100000000000000"
}
```

---

## File Case (x402)

```
POST /cases/file-x402
```

Build an unsigned `fileNewCase` transaction from an x402 payment proof.

**Body:**
```json
{
  "plaintiffAddress": "0x...",
  "defendantAddress": "0x...",
  "claimDescription": "...",
  "proof": { "txHash": "0x..." }
}
```

---

## Submit Vote

```
POST /cases/{address}/vote
```

**Body:**
```json
{ "plaintiff_wins": true }
```

Returns an unsigned `submitVote` transaction. Must be signed by an assigned judge.

---

## Resolve After Deadline

```
POST /cases/{address}/resolve-timeout
```

Trigger deadline resolution when no majority is reached and voting period expired.

---

## Trigger Default

```
POST /cases/{address}/trigger-default
```

Call after response deadline passes with no defendant response. Awards case to plaintiff.

---

## Appeal

```
POST /cases/{address}/appeal
```

File an appeal within the 10-minute appeal window after verdict. Requires `APPEAL_BOND` ETH.

---

## Assign Judges

```
POST /cases/{address}/assign-judges
```

**Body:**
```json
{ "judges": ["0xJudge1", "0xJudge2", "0xJudge3"] }
```

---

## Assign Judges (Random)

```
POST /cases/{address}/assign-judges-random
```

Pseudo-randomly selects 3 eligible judges from the pool, excluding plaintiff and defendant.
