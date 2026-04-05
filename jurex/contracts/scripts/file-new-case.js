const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const REGISTRY_ADDRESS = '0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB';
const FACTORY_ADDRESS = '0x59A080BEe39B9992bC2c5b94790897295CCBa0a8';

async function main() {
  const [plaintiff] = await ethers.getSigners();
  
  // Load defendant wallet
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const defendantAddress = walletInfo.defendant.address;
  
  console.log('📋 Filing New Case with Funded Defendant');
  console.log('Plaintiff:', plaintiff.address);
  console.log('Defendant:', defendantAddress);
  
  const CourtCaseFactory = await ethers.getContractFactory('CourtCaseFactory');
  const factory = CourtCaseFactory.attach(FACTORY_ADDRESS);
  
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS);
  
  // Register both if needed
  let plaintiffRep = await registry.getReputation(plaintiff.address).catch(() => 0n);
  if (plaintiffRep === 0n) {
    console.log('\n📝 Registering plaintiff...');
    const tx = await registry.registerAgent(
      plaintiff.address,
      ethers.keccak256(ethers.toUtf8Bytes('agent-court-plaintiff-new'))
    );
    await tx.wait();
    console.log('✅ Plaintiff registered');
  }
  
  // Register defendant (as plaintiff for gas efficiency, then transfer)
  let defendantRep = await registry.getReputation(defendantAddress).catch(() => 0n);
  if (defendantRep === 0n) {
    console.log('📝 Registering defendant...');
    const tx = await registry.registerAgent(
      defendantAddress,
      ethers.keccak256(ethers.toUtf8Bytes('agent-court-defendant-new'))
    );
    await tx.wait();
    console.log('✅ Defendant registered');
  }
  
  // File the case
  console.log('\n📁 Filing case...');
  const BASE_FEE = ethers.parseEther('0.01');
  
  const tx = await factory.fileNewCase(
    defendantAddress,
    'Service delivery dispute - AI agent failed to provide promised integration',
    'QmNewEvidenceHashForTesting',
    { value: BASE_FEE * 2n }
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(l => l.fragment?.name === 'CaseCreated');
  const caseAddress = event?.args?.caseAddress;
  
  console.log('✅ Case filed!');
  console.log('   Case Address:', caseAddress);
  console.log('   Tx Hash:', tx.hash);
  console.log('   Explorer: https://sepolia.arbiscan.io/tx/' + tx.hash);
  
  // Save case info
  const caseInfo = {
    network: 'arbitrumSepolia',
    createdAt: new Date().toISOString(),
    caseAddress: caseAddress,
    plaintiff: plaintiff.address,
    defendant: defendantAddress,
    transaction: tx.hash,
    explorer: 'https://sepolia.arbiscan.io/address/' + caseAddress
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', '.active-case'),
    JSON.stringify(caseInfo, null, 2)
  );
  
  console.log('\n💾 Saved to .active-case');
  console.log('\n🎯 DEFENDANT: Respond with:');
  console.log('   npx hardhat run scripts/defendant-respond.js --network arbitrumSepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
