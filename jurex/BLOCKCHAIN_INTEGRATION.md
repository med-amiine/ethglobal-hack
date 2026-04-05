# Blockchain Integration Guide

## 🔗 What's Real vs Mocked

### ✅ NOW REAL (Testnet Signing Required)

#### 1. **Agent Registration** (CourtRegistry.selfRegister)
- **URL:** `http://localhost:3000/register`
- **Flow:**
  1. Enter agent name + description
  2. Click "Sign Transaction" → Opens wallet
  3. User signs `selfRegister()` call (no parameters)
  4. Contract auto-generates erc8004Id from address + block.timestamp
  5. Transaction hash submitted to verify on-chain
  6. System confirms TxHash exists on Base Sepolia
  7. ENS name mapping stored in local registry (ens-registry.json)

- **Contract:** `0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D`
- **Function:** `selfRegister()` (external, parameterless)
- **Network:** Base Sepolia (84532)
- **Requires:** Wallet connection + signature

#### 2. **Escrow Locking** (TaskEscrow.lockFunds)
- **URL:** `http://localhost:3000/hire` 
- **Flow:**
  1. Search agent
  2. Create task + set budget
  3. Click "Hire" → Opens wallet
  4. User signs `lockFunds(caseId, amount, client)` call
  5. USDC locked in private escrow on-chain

- **Contract:** `0xb80523c535B873f5ac631E143117FF3A73cA57b3`
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Requires:** USDC approval + signature

---

### 📝 STILL MOCKED (JSON Storage)

These still use JSON files for demo/dev purposes:

| Feature | Storage | Status |
|---------|---------|--------|
| Case creation | `data/cases.json` | Demo only |
| Judge voting | `data/judges.json` | Demo only |
| Task metadata | `data/tasks.json` | Demo only |
| Agent lookup | `data/ens-registry.json` | Demo only |

---

## 🧪 Testing Real Blockchain

### Prerequisites

1. **Connect Wallet:**
   - Use MetaMask or any EIP-1193 compatible wallet
   - Switch to **Base Sepolia** network
   - Chain ID: `84532`
   - RPC: `https://sepolia.base.org`

2. **Get Base Sepolia ETH:**
   ```
   https://www.alchemy.com/faucets/base-sepolia
   https://coinbase.com/faucets/base-sepolia
   ```

3. **Get Base Sepolia USDC:**
   ```bash
   # USDC contract address
   0x036CbD53842c5426634e7929541eC2318f3dCF7e
   ```

### Test Workflow

#### **Test 1: Register Agent**

```
1. Visit http://localhost:3000/register
2. Ensure wallet is connected to Base Sepolia
3. Enter agent name (e.g., "testagent")
4. Click "Sign Transaction"
   → MetaMask opens
   → Shows: "selfRegister()" with no parameters
   → User signs
5. TxHash submitted to verify
   → System checks Base Sepolia
   → Confirms transaction exists and succeeded
6. Success screen shows transaction details and ENS name
```

**What happens on-chain:**
- `CourtRegistry.selfRegister()` is called by user's wallet
- Agent address registered with auto-generated ERC-8004 ID
- ERC-8004 ID = keccak256("erc8004:" + address + block.timestamp)
- `AgentRegistered` event emitted
- ENS name stored in local registry (ens-registry.json) for lookups
- Verifiable on Basescan

---

#### **Test 2: Hire Agent & Lock Escrow**

```
1. Visit http://localhost:3000/hire
2. Ensure wallet on Base Sepolia with USDC
3. Search agent you just registered
4. Create task with budget (e.g., 100 USDC)
5. Click "Create Escrow + Hire"
   → MetaMask opens for USDC approval
   → User approves TaskEscrow to spend USDC
   → MetaMask opens for lockFunds call
   → Shows: "lockFunds(caseId, amount, client)"
   → User signs
6. Success screen shows:
   - Task ID
   - Escrow amount locked
   - TxHash
```

**What happens on-chain:**
- USDC approved to TaskEscrow contract
- `TaskEscrow.lockFunds()` called
- Funds locked until verdict
- `FundsLocked` event emitted
- Verifiable on Basescan

---

## 🔐 Contract Interaction Details

### CourtRegistry

```solidity
function selfRegister() external
```

**Parameters:** None

**What the contract does:**
- Uses `msg.sender` as the agent address
- Generates `erc8004Id = keccak256(abi.encodePacked("erc8004:", msg.sender, block.timestamp))`
- Creates agent profile with reputation score 100
- Reverts if already registered or ERC-8004 ID collision

**Events:**
```solidity
event AgentRegistered(address indexed agent, bytes32 indexed erc8004Id, uint256 timestamp)
```

**Note:** The ENS name (e.g., "testagent.jurex.eth") is stored off-chain in the local registry for lookups.
Users can look up agents by their chosen ENS name via `GET /api/ens/resolve?name=testagent.jurex.eth`

---

### TaskEscrow

```solidity
function lockFunds(uint256 caseId, uint256 amount, address client) external
```

**Parameters:**
- `caseId`: Task ID (ties to case)
- `amount`: USDC amount in wei (6 decimals)
- `client`: Address that locked funds

**Requirements:**
- USDC must be approved first: `USDC.approve(TaskEscrow, amount)`
- Amount must be positive integer

**Events:**
```solidity
event FundsLocked(uint256 indexed caseId, address indexed client, uint256 amount)
```

---

## 📊 Verification

### Check Transaction on Basescan

1. Copy transaction hash from success screen
2. Visit: `https://sepolia.basescan.org/tx/[txHash]`
3. Verify:
   - Status: Success ✓
   - To: Contract address
   - From: Your wallet
   - Function: `registerAgent` or `lockFunds`

### Query Contract State

```bash
# Check if agent is registered
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0x9942F8Eed1334beD4e8283DCE76a2e2c23B46d4D",
      "data": "0x..." # getAgentProfile call
    }],
    "id": 1
  }'
```

---

## 🚨 Common Issues

| Error | Solution |
|-------|----------|
| "Wallet not available" | MetaMask not installed or not connected |
| "Wrong network" | Switch to Base Sepolia (84532) |
| "Insufficient balance" | Get ETH from faucet |
| "Allowance not set" | Approve USDC first via `USDC.approve()` |
| "Transaction reverted" | Check contract parameters on Basescan |

---

## 🎯 Demo Mode (Still Mocked)

For hackathon booth demo without signing:

```
http://localhost:3000/demo
```

This runs the full 5-step workflow with **mock JSON storage**:
- ✗ No real wallet signing
- ✗ No on-chain transactions
- ✓ Shows complete UX flow
- ✓ Perfect for booth demo in 45 seconds

---

## 📚 Resources

| Link | Purpose |
|------|---------|
| [Base Docs](https://docs.base.org) | Network info |
| [Contract ABIs](./lib/contracts.ts) | All contract interfaces |
| [Basescan](https://sepolia.basescan.io) | Block explorer |
| [Viem Docs](https://viem.sh) | Web3 library |

---

## Next Steps

1. **Test registration flow** with real wallet signing
2. **Verify transactions** on Basescan
3. **Lock escrow** with real USDC (testnet)
4. **Use demo page** for booth without signatures

---

**Built with:** viem + wagmi + RainbowKit  
**Network:** Base Sepolia  
**Verified:** Basescan
