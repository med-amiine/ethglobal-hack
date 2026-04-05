const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const REGISTRY_ADDRESS = '0xBdEA6Dcd8DF24B7719F857a62EC4Ea07F0BFdd5b';
const FACTORY_ADDRESS = '0x2e7209D2fDbaBC7AFc1218c85b9f0f1d38be226e';

async function main() {
  const [plaintiff] = await ethers.getSigners();
  
  // Load defendant wallet
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const defendantAddress = walletInfo.defendant.address;
  
  console.log('🧪 FILING TEST CASE (Tiny Stakes)');
  console.log('Plaintiff:', plaintiff.address);
  console.log('Defendant:', defendantAddress);
  console.log('Stake: 0.0002 ETH');
  console.log('');
  
  const CourtCaseFactoryTest = await ethers.getContractFactory('CourtCaseFactoryTest');
  const factory = CourtCaseFactoryTest.attach(FACTORY_ADDRESS);
  
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS);
  
  // Register plaintiff
  let plaintiffRep = await registry.getReputation(plaintiff.address).catch(() => 0n);
  if (plaintiffRep === 0n) {
    console.log('📝 Registering plaintiff...');
    const tx = await registry.registerAgent(
      plaintiff.address,
      ethers.keccak256(ethers.toUtf8Bytes('test-plaintiff'))
    );
    await tx.wait();
    console.log('✅ Plaintiff registered');
  }
  
  // Register defendant
  let defendantRep = await registry.getReputation(defendantAddress).catch(() => 0n);
  if (defendantRep === 0n) {
    console.log('📝 Registering defendant...');
    const tx = await registry.registerAgent(
      defendantAddress,
      ethers.keccak256(ethers.toUtf8Bytes('test-defendant'))
    );
    await tx.wait();
    console.log('✅ Defendant registered');
  }
  
  // File case with 0.0002 ETH
  console.log('\n📁 Filing test case...');
  const tx = await factory.fileNewCase(
    defendantAddress,
    'Test dispute - service delivery',
    'QmTestEvidenceHash',
    { value: ethers.parseEther('0.0002') }
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(l => l.fragment?.name === 'CaseCreated');
  const caseAddress = event?.args?.caseAddress;
  
  console.log('✅ TEST CASE FILED!');
  console.log('   Case Address:', caseAddress);
  console.log('   Tx Hash:', tx.hash);
  console.log('   Explorer: https://sepolia.arbiscan.io/tx/' + tx.hash);
  
  // Check state
  const CourtCaseTest = await ethers.getContractFactory('CourtCaseTest');
  const courtCase = CourtCaseTest.attach(caseAddress);
  const state = await courtCase.state();
  const deadline = await courtCase.deadlineToRespond();
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  
  console.log('\n📊 Case Status:', states[state]);
  console.log('⏰ Deadline:', new Date(Number(deadline) * 1000).toISOString());
  console.log('   (5 minutes to respond)');
  
  // Save case info
  fs.writeFileSync(
    path.join(__dirname, '..', '.test-case'),
    JSON.stringify({
      caseAddress,
      plaintiff: plaintiff.address,
      defendant: defendantAddress,
      transaction: tx.hash,
      filedAt: new Date().toISOString()
    }, null, 2)
  );
  
  console.log('\n🎯 DEFENDANT: Respond with:');
  console.log('   npx hardhat run scripts/defendant-respond-test.js --network arbitrumSepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
