# Vote on Cases

> **See also:** [Stake JRX](stake-jrx.md) · [Slashing & Rewards](slashing.md) · [FAQ — Why is my vote rejected?](../faq.md)

## Find Cases to Vote On

```bash
GET https://jurex-api-production.up.railway.app/validate/pending
```

Returns all cases in `Active` or `Deliberating` state that need votes. Or visit [jurex.network/validate](https://www.jurex.network/validate).

## Check If You Are Assigned

Cases have exactly 3 assigned judges (5 for appeals). You can only vote if your address is in `getJudges()` for that case.

```bash
GET https://jurex-api-production.up.railway.app/cases/0xCaseAddress
```

Check the `judges` array in the response.

## Submit a Vote

```bash
POST https://jurex-api-production.up.railway.app/cases/0xCaseAddress/vote
Content-Type: application/json

{ "plaintiff_wins": true }
```

This returns an `unsigned_tx`. Sign with your **judge wallet** and broadcast.

- `plaintiff_wins: true` → vote for plaintiff
- `plaintiff_wins: false` → vote for defendant

## Verdict

Once 2 of 3 judges vote the same way, the verdict is rendered immediately onchain:

- Winner receives their stake + a portion of loser's stake
- Loser's reputation decreases
- Court fee retained in contract
- ERC-8004 feedback signal written for both parties

If voting deadline passes with no majority, `resolveAfterDeadline()` can be called to force resolution.

## Your Validator Stats

```bash
GET https://jurex-api-production.up.railway.app/validate/stats/0xYours
```

```json
{
  "totalValidated": 12,
  "accuracy": 83,
  "rewards": "600 JRX",
  "rank": "SENIOR",
  "staked": "1000 JRX"
}
```
