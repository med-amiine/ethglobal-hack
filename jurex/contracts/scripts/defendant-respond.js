const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  // Load case info
  const casePath = path.join(__dirname, '..', '.active-case');
  if (!fs.existsSync(casePath)) {
    console.log('❌ No active case found. Run file-new-case.js first');
    process.exit(1);
  }
  
  const caseInfo = JSON.parse(fs.readFileSync(casePath, 'utf8'));
  
  // Load defendant wallet
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  
  console.log('⚖️  DEFENDANT RESPONDING TO CASE');
  console.log('=================================');
  console.log('Case:', caseInfo.caseAddress);
  console.log('Defendant:', walletInfo.defendant.address);
  console.log('');
  
  // Connect as defendant
  const provider = ethers.provider;
  const defendantSigner = new ethers.Wallet(walletInfo.defendant.privateKey, provider);
  
  const CourtCase = await ethers.getContractFactory('CourtCase');
  const courtCase = CourtCase.attach(caseInfo.caseAddress).connect(defendantSigner);
  
  // Check case state
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  const state = await courtCase.state();
  console.log('Current State:', states[state]);
  
  if (state !== 1n) { // Not Summoned
    console.log('❌ Case is not in Summoned state');
    return;
  }
  
  // Respond with stake
  const BASE_FEE = ethers.parseEther('0.01');
  console.log('\n💰 Staking 0.01 ETH to respond...');
  
  const tx = await courtCase.respondToCase({ value: BASE_FEE });
  await tx.wait();
  
  console.log('✅ RESPONDED!');
  console.log('   Tx Hash:', tx.hash);
  console.log('   Explorer: https://sepolia.arbiscan.io/tx/' + tx.hash);
  
  // Check updated state
  const newState = await courtCase.state();
  console.log('\n📊 Updated State:', states[newState]);
  
  // Submit evidence
  console.log('\n📎 Submitting evidence...');
  const evidenceTx = await courtCase.submitEvidence('QmDefendantEvidenceHash');
  await evidenceTx.wait();
  console.log('✅ Evidence submitted! Tx:', evidenceTx.hash);
  
  console.log('\n🎯 NEXT: Assign judges and vote');
  console.log('   npx hardhat run scripts/assign-judges.js --network arbitrumSepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
