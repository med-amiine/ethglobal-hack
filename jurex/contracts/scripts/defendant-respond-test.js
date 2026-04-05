const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const CASE_ADDRESS = fs.existsSync(path.join(__dirname, '..', '.test-case')) 
  ? JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.test-case'), 'utf8')).caseAddress
  : null;

async function main() {
  if (!CASE_ADDRESS) {
    console.log('❌ No test case found. Run file-test-case.js first');
    process.exit(1);
  }
  
  // Load defendant wallet
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  
  console.log('⚖️  DEFENDANT RESPONDING (Test Case)');
  console.log('Case:', CASE_ADDRESS);
  console.log('Defendant:', walletInfo.defendant.address);
  console.log('Stake: 0.0001 ETH');
  console.log('');
  
  const provider = ethers.provider;
  const defendantSigner = new ethers.Wallet(walletInfo.defendant.privateKey, provider);
  
  const CourtCaseTest = await ethers.getContractFactory('CourtCaseTest');
  const courtCase = CourtCaseTest.attach(CASE_ADDRESS).connect(defendantSigner);
  
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  const state = await courtCase.state();
  console.log('Current State:', states[state]);
  
  if (state !== 1n) {
    console.log('❌ Case not in Summoned state');
    return;
  }
  
  const remaining = await courtCase.getTimeRemaining();
  console.log('Time remaining:', Number(remaining), 'seconds');
  
  console.log('\n💰 Responding with 0.0001 ETH stake...');
  const tx = await courtCase.respondToCase({ value: ethers.parseEther('0.0001') });
  await tx.wait();
  
  console.log('✅ RESPONDED! Tx:', tx.hash);
  
  const newState = await courtCase.state();
  console.log('\n📊 New State:', states[newState]);
  
  console.log('\n🎯 NEXT: Assign judges and vote');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
