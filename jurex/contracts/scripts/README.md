# Deployment Scripts

## Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

## Environment Setup

Create `.env` file:

```
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

## Post-Deployment

1. Save `deployments.json` — contains all contract addresses
2. Verify contracts on Basescan:
   ```bash
   npx hardhat verify --network baseSepolia CONTRACT_ADDRESS
   ```
3. Register test agents for demo
4. File demo cases and capture transaction hashes
