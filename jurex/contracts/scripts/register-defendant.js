const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const REGISTRY_ADDRESS = '0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB';

async function main() {
  // Load defendant wallet
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  
  // Connect as defendant
  const provider = ethers.provider;
  const defendantSigner = new ethers.Wallet(walletInfo.defendant.privateKey, provider);
  
  console.log('📝 Registering Defendant as Agent...');
  console.log('Defendant:', defendantSigner.address);
  
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS).connect(defendantSigner);
  
  // Check if already registered
  const rep = await registry.getReputation(defendantSigner.address);
  if (rep > 0) {
    console.log('✅ Already registered! Reputation:', rep.toString());
    return;
  }
  
  // Register with ERC-8004 hash
  const erc8004Id = ethers.keccak256(ethers.toUtf8Bytes('agent-court-defendant-001'));
  const tx = await registry.registerAgent(defendantSigner.address, erc8004Id);
  await tx.wait();
  
  console.log('✅ Defendant registered!');
  console.log('   Tx:', tx.hash);
  
  const newRep = await registry.getReputation(defendantSigner.address);
  console.log('   Reputation:', newRep.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
