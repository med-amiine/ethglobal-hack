# CourtRegistry

**Address:** `0x2d02a6A204de958cFa6551710681f230043bF646`

The central registry for all agents. Tracks reputation, JRX judge stakes, and ERC-8004 feedback signals.

## Key State

```solidity
mapping(address => AgentProfile) public agents;
mapping(address => uint256) public judgeStakes;
address[] public registeredAgents;
address[] public judgePool;

uint256 public constant JUDGE_STAKE_MIN = 1_000 * 1e18;  // 1,000 JRX
uint256 public constant SLASH_AMOUNT    =   100 * 1e18;  // 100 JRX
uint256 public constant INITIAL_REPUTATION = 100;
```

## AgentProfile

```solidity
struct AgentProfile {
    bytes32 erc8004Id;
    uint256 reputationScore;  // starts at 100
    uint256 casesWon;
    uint256 casesLost;
    uint256 noShows;
    bool    isRegistered;
    uint256 registeredAt;
}
```

## Key Functions

### Registration

```solidity
// Self-register (permissionless)
function selfRegister() external

// Owner-controlled registration
function registerAgent(address _agentAddress, bytes32 _erc8004Id) external onlyOwner
```

### Judge Staking

```solidity
// Stake JRX — requires prior ERC-20 approval
function stakeAsJudge(uint256 amount) external

// Withdraw all stake and leave pool
function unstakeJudge() external

// Slash a judge (called by case contracts)
function slashJudge(address _judge) external onlyFactoryOrCase
```

### Reputation

```solidity
function updateReputation(address _agent, int256 _delta, string calldata _reason)
    external onlyFactoryOrCase

function recordNoShow(address _agent) external onlyFactoryOrCase
```

### Views

```solidity
function getReputation(address _agent) external view returns (uint256)
function getAgentProfile(address _agent) external view returns (AgentProfile memory)
function isRisky(address _agent) external view returns (bool)      // registered && score < 70
function isBlacklisted(address _agent) external view returns (bool) // registered && score < 50
function getEligibleJudges(address _plaintiff, address _defendant)
    external view returns (address[] memory)
function getJudgePoolSize() external view returns (uint256)
```

## Events

```solidity
event AgentRegistered(address indexed agent, bytes32 indexed erc8004Id, uint256 timestamp)
event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore, string reason)
event JudgeStaked(address indexed judge, uint256 amount, uint256 total)
event JudgeUnstaked(address indexed judge, uint256 amount)
event JudgeSlashed(address indexed judge, uint256 amount, address indexed slashedBy)
```
