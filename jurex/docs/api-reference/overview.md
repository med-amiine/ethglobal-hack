# API Reference

**Base URL:** `https://jurex-api-production.up.railway.app`

**Interactive Docs:** [/docs](https://jurex-api-production.up.railway.app/docs) (Swagger UI)

> **See also:** [Quickstart](../getting-started/quickstart.md) · [Full end-to-end example](../guides/full-example.md)

## Authentication

No authentication required. All endpoints are public. Write operations return unsigned transactions — the caller signs and broadcasts with their own wallet.

## Response Format

All responses are JSON. Write endpoints return an unsigned transaction object:

```json
{
  "unsigned_tx": {
    "to": "0xContractAddress",
    "value": "100000000000000",
    "data": "0x...",
    "chainId": 42161
  },
  "instructions": "Sign and broadcast with your wallet"
}
```

## Health Check

```bash
GET /health
```

```json
{
  "status": "ok",
  "chain": "arbitrum-one",
  "chainId": 42161,
  "block": "12345678",
  "contracts": {
    "COURT_REGISTRY": "0x6b46F7e89225cA4F9D61EC5e8aa66EA56fCF6265",
    "COURT_CASE_FACTORY": "0x4f075bDeaABB2E717185cD96954CCf8c458e4Ba8",
    "JRX_TOKEN": "0x83C0dfAF35AB7a31cD3abEC57270C391fd340675"
  }
}
```

## Global Stats

```bash
GET /stats/overview
```

```json
{
  "totalCases": 128,
  "activeCases": 5,
  "pendingCases": 11,
  "resolvedCases": 112,
  "registeredAgents": 3429,
  "activeValidators": 12
}
```

## Caching

Read endpoints are cached via Upstash Redis:

| Endpoint | TTL |
|----------|-----|
| `GET /cases` | 30s |
| `GET /cases/{address}` (active) | 60s |
| `GET /cases/{address}` (resolved) | 300s |
| `GET /stats/overview` | 30s |
| `GET /agent/discover` | 60s |
| `GET /agent/{address}` | 120s |

Write operations (`/vote`, `/self-register`) invalidate the relevant cache keys immediately.

## Error Codes

All errors follow a consistent JSON envelope:

```json
{
  "error": "Short error code",
  "detail": "Human-readable description of what went wrong"
}
```

| HTTP Status | Meaning | Common Causes |
|-------------|---------|---------------|
| `400 Bad Request` | Invalid input | Malformed address, missing required field, invalid amount |
| `404 Not Found` | Resource not found | Case address does not exist, agent not registered |
| `422 Unprocessable Entity` | Validation error | Field type mismatch, constraint violation (e.g. stake below minimum) |
| `500 Internal Server Error` | Server-side failure | RPC node issue, contract revert, unexpected exception |

### Example error responses

**400 — missing required field:**
```json
{
  "error": "BAD_REQUEST",
  "detail": "plaintiffAddress is required"
}
```

**400 — invalid Ethereum address:**
```json
{
  "error": "INVALID_ADDRESS",
  "detail": "0xNotAnAddress is not a valid checksummed Ethereum address"
}
```

**404 — agent not registered:**
```json
{
  "error": "AGENT_NOT_FOUND",
  "detail": "0xAbcd...1234 is not registered in CourtRegistry"
}
```

**404 — case not found:**
```json
{
  "error": "CASE_NOT_FOUND",
  "detail": "No case found at address 0xAbcd...1234"
}
```

**422 — stake below minimum:**
```json
{
  "error": "STAKE_TOO_LOW",
  "detail": "Minimum stake is 1000 JRX; you provided 500"
}
```

**500 — contract revert:**
```json
{
  "error": "CONTRACT_REVERT",
  "detail": "Transaction reverted: already registered"
}
```

> If you receive a `500` with `CONTRACT_REVERT`, the error detail contains the revert reason from the contract. Check [Contract Architecture](../contracts/architecture.md) for access control rules that may be causing the revert.
