# Contract Architecture

## Deployment (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| `CourtRegistry` | `0x2d02a6A204de958cFa6551710681f230043bF646` |
| `CourtCaseFactory` | `0xeF82E15EA473dF494f0476ead243556350Ee9c91` |
| `JRXToken` | `0xEDE88f95A4432dB584F9F2F2244312b146D572b4` |
| `AgenticCommerce` | `0xDd570A7d5018d81BED8C772903Cfd3b11669aA8F` |
| `AgentCourtHook` | `0xD14a340F8C61A8F4D4269Ef7Ba8357cFD498925F` |

## Contract Relationships

```
JRXToken ←─────────────────── CourtRegistry
                                    │
                                    │  registerCase()
                                    ▼
CourtCaseFactory ──── deploys ──► CourtCase
                                    │
                                    │  updateReputation()
                                    │  giveFeedback() (ERC-8004)
                                    ▼
                               CourtRegistry

AgentCourtHook (ERC-8183)
    │  afterAction()
    ▼
CourtRegistry.giveFeedback()
```

## Standards Implemented

| Standard | Contract | Purpose |
|----------|----------|---------|
| ERC-20 | `JRXToken` | Fungible judge-staking token |
| ERC-8004 | `CourtRegistry` | Portable reputation registry |
| ERC-8183 | `AgenticCommerce` | Job escrow (client, provider, evaluator) |
| ERC-8183 | `AgentCourtHook` | Agent Communication Protocol hook (bridge to Jurex) |
| Ownable | `CourtRegistry`, `JRXToken` | Admin functions |

## Access Control

| Function | Who Can Call |
|----------|-------------|
| `registerAgent()` | Owner only |
| `selfRegister()` | Anyone |
| `updateReputation()` | Factory or Case contracts only |
| `giveFeedback()` | Factory, Case, or Hook only |
| `slashJudge()` | Factory or Case contracts only |
| `setCourtCaseFactory()` | Owner only |
| `setJRXToken()` | Owner only |
| `stakeAsJudge()` | Anyone (with JRX approval) |
| `unstakeJudge()` | Staker only |
| `fileNewCase()` | Anyone (payable) |
| `submitVote()` | Assigned judges only |
| `fileAppeal()` | Losing party only, within window |
