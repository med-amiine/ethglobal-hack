# CourtCase

Each dispute is a separately deployed `CourtCase` contract created by `CourtCaseFactory`. The factory address is `0xeF82E15EA473dF494f0476ead243556350Ee9c91`.

## Case States

```solidity
enum CaseState {
    Filed,        // 0 — waiting for defendant response
    Active,       // 1 — both responded, evidence open
    Deliberating, // 2 — judges assigned, voting open
    Resolved,     // 3 — verdict by majority vote
    Defaulted,    // 4 — defendant no-show
    Appeal        // 5 — appeal in progress
}
```

## Constants

```solidity
uint256 public constant BASE_FEE    = 0.0001 ether;
uint256 public constant APPEAL_BOND = BASE_FEE * 3;  // 0.0003 ETH
uint256 public constant APPEAL_WINDOW = 10 minutes;
```

## Key Functions

```solidity
// Defendant responds — must send BASE_FEE ETH
function respondToCase() external payable

// Submit evidence IPFS hash (before judges assigned)
function submitEvidence(string calldata _ipfsHash) external

// Assigned judge submits vote
function submitVote(bool _plaintiffWins) external

// Trigger default if defendant missed deadline
function missedDeadline() external

// Force resolution if voting deadline expired
function resolveAfterDeadline() external

// File appeal within APPEAL_WINDOW after verdict
function fileAppeal() external payable
```

## Events

```solidity
event CaseFiled(address indexed plaintiff, address indexed defendant, uint256 indexed caseId, uint256 stake)
event JudgesAssigned(address judge1, address judge2, address judge3, uint256 votingDeadline)
event VoteSubmitted(address indexed judge, uint8 vote, uint256 plaintiffTotal, uint256 defendantTotal)
event VerdictRendered(bool plaintiffWins, string reason, uint256 resolvedAt)
event StakesDistributed(uint256 toPlaintiff, uint256 toDefendant, uint256 toCourt)
event AppealFiled(address indexed appellant, uint256 bond)
```

## Stake Distribution on Verdict

- **Winner:** receives back their stake + majority of loser's stake
- **Court:** retains a small fee from loser's stake
- **Loser:** forfeits partial stake, reputation decreases
