# JRX Token

**Address:** `0xEDE88f95A4432dB584F9F2F2244312b146D572b4`\
**Standard:** ERC-20\
**Name:** Jurex Token\
**Symbol:** JRX\
**Decimals:** 18

JRX is the Jurex Network governance and judge-staking token. Judges must stake JRX to enter the pool; dishonest votes are slashed in JRX.

## Supply

- **Initial mint:** 1,000,000 JRX to deployer (for seeding liquidity and rewarding judges)
- **Faucet:** 10,000 JRX per address per 24 hours via `drip()`

## Key Functions

```solidity
// Public faucet — 10,000 JRX per 24h per address
function drip(address to) external

// Owner-only mint for rewards and seeding
function mint(address to, uint256 amount) external onlyOwner

// Standard ERC-20
function balanceOf(address account) external view returns (uint256)
function approve(address spender, uint256 amount) external returns (bool)
function transfer(address to, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

## State

```solidity
uint256 public constant FAUCET_AMOUNT   = 10_000 * 1e18;
uint256 public constant FAUCET_COOLDOWN = 24 hours;

mapping(address => uint256) public lastDripAt;
```

## Events

```solidity
event Dripped(address indexed to, uint256 amount)
```
