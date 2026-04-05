const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const REGISTRY_ADDRESS = '0xBdEA6Dcd8DF24B7719F857a62EC4Ea07F0BFdd5b';
const CASE_ADDRESS = fs.existsSync(path.join(__dirname, '..', '.test-case'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.test-case'), 'utf8')).caseAddress
  : null;

async function main() {
  if (!CASE_ADDRESS) {
    console.log('❌ No active case');
    process.exit(1);
  }
  
  // Load defendant wallet (has funds!)
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  
  const provider = ethers.provider;
  const defendantSigner = new ethers.Wallet(walletInfo.defendant.privateKey, provider);
  
  console.log('👥 ASSIGNING JUDGES (Using Defendant Wallet)');
  console.log('Case:', CASE_ADDRESS);
  console.log('Funding Wallet:', defendantSigner.address);
  console.log('');
  
  // Check balance
  const balance = await provider.getBalance(defendantSigner.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  console.log('');
  
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS).connect(defendantSigner);
  
  const CourtCaseTest = await ethers.getContractFactory('CourtCaseTest');
  const courtCase = CourtCaseTest.attach(CASE_ADDRESS).connect(defendantSigner);
  
  const plaintiff = await courtCase.plaintiff();
  const defendant = await courtCase.defendant();
  
  // Create 3 judge wallets
  const judges = [];
  for (let i = 0; i < 3; i++) {
    const judgeWallet = ethers.Wallet.createRandom();
    judges.push(judgeWallet);
    
    // Fund judge from defendant wallet
    console.log(`💸 Funding Judge ${i+1}:`, judgeWallet.address);
    const fundTx = await defendantSigner.sendTransaction({
      to: judgeWallet.address,
      value: ethers.parseEther('0.0005') // Enough for gas
    });
    await fundTx.wait();
    
    // Register judge with reputation (unique ID)
    const uniqueId = ethers.keccak256(ethers.toUtf8Bytes(`judge-${i}-${Date.now()}`));
    const tx = await registry.registerAgent(judgeWallet.address, uniqueId);
    await tx.wait();
    
    console.log(`✅ Judge ${i+1} ready`);
  }
  
  // Save judges
  fs.writeFileSync(
    path.join(__dirname, '..', '.judges'),
    JSON.stringify({
      caseAddress: CASE_ADDRESS,
      judges: judges.map(j => ({
        address: j.address,
        privateKey: j.privateKey
      }))
    }, null, 2)
  );
  
  // Assign judges to case
  console.log('\n🔗 Assigning judges to case...');
  const judgeAddresses = judges.map(j => j.address);
  const assignTx = await courtCase.assignJudges(judgeAddresses);
  await assignTx.wait();
  
  console.log('✅ JUDGES ASSIGNED!');
  console.log('');
  judges.forEach((j, i) => console.log(`   Judge ${i+1}: ${j.address}`));
  
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  const newState = await courtCase.state();
  console.log('\n📊 Case State:', states[newState]);
  
  console.log('\n🎯 NEXT: Submit votes');
  console.log('   npx hardhat run scripts/judges-vote.js --network arbitrumSepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
