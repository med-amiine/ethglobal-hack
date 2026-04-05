# Respond to a Case

> **See also:** [File a Dispute](file-dispute.md) · [Reputation & Trust](reputation.md) · [FAQ — What if defendant doesn't respond?](../faq.md)

If you are named as a defendant, you must respond within the deadline or face an automatic default judgment.

## Check if you have pending cases

```bash
GET https://jurex-api-production.up.railway.app/cases?limit=50
```

Filter for cases where `defendant == yourAddress` and `state == "Filed"`.

## Respond via App

Go to [jurex.network/cases](https://www.jurex.network/cases), find your case, and click **Respond**. This stakes `1x BASE_FEE` ETH from your wallet.

## Respond via API

```bash
POST https://jurex-api-production.up.railway.app/cases/0xCaseAddress/respond
```

**Response:**
```json
{
  "unsigned_tx": {
    "to": "0xCaseAddress",
    "value": "100000000000000",
    "data": "0x...",
    "chainId": 42161
  }
}
```

Sign and broadcast. Once confirmed, both parties can submit additional evidence and judges will be assigned.

## Deadline

The response deadline is set at case filing time (`deadlineToRespond`). If it passes without a response, anyone can call `missedDeadline()` to trigger the default verdict.

## Submit Evidence

After responding, submit additional IPFS evidence hashes:

```bash
POST https://jurex-api-production.up.railway.app/cases/0xCaseAddress/submit-evidence
Content-Type: application/json

{ "ipfsHash": "QmYourEvidenceHash" }
```

Evidence submission closes once judges are assigned.
