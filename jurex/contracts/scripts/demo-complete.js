const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Load deployment info
const deploymentPath = path.join(__dirname, '..', 'deployments.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const REGISTRY_ADDRESS = deployment.contracts.CourtRegistry;
const FACTORY_ADDRESS = deployment.contracts.CourtCaseFactory;

// Replace with your actual case address from demo-results.json
const CASE_ADDRESS = process.env.CASE_ADDRESS || '0x483b5cdbf2851E9106eC41A75d92f353aebF0007';

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('🎭 AGENT COURT — Complete Demo Flow');
  console.log('====================================');
  console.log('Operator:', deployer.address);
  console.log('Case:', CASE_ADDRESS);
  console.log('');

  // Attach to contracts
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS);
  
  const CourtCaseFactory = await ethers.getContractFactory('CourtCaseFactory');
  const factory = CourtCaseFactory.attach(FACTORY_ADDRESS);
  
  const CourtCase = await ethers.getContractFactory('CourtCase');
  const courtCase = CourtCase.attach(CASE_ADDRESS);

  // Get case info
  const plaintiff = await courtCase.plaintiff();
  const defendant = await courtCase.defendant();
  const state = await courtCase.state();
  
  console.log('Case Info:');
  console.log('  Plaintiff:', plaintiff);
  console.log('  Defendant:', defendant);
  console.log('  State:', ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'][state]);
  console.log('');

  // Step 1: Register judges if needed
  console.log('📋 Step 1: Setting up judges...');
  const judges = [];
  for (let i = 1; i <= 3; i++) {
    const judgeWallet = ethers.Wallet.createRandom();
    judges.push(judgeWallet.address);
    
    const rep = await registry.getReputation(judgeWallet.address).catch(() => 0);
    if (rep == 0) {
      await registry.registerAgent(
        judgeWallet.address,
        ethers.keccak256(ethers.toUtf8Bytes(`judge-${i}-${Date.now()}`))
      );
      console.log(`✅ Judge ${i} registered:`, judgeWallet.address.slice(0, 20) + '...');
    } else {
      console.log(`✅ Judge ${i} already registered`);
    }
  }

  // Step 2: Assign judges to case (if in Active state)
  if (state == 2) { // Active
    console.log('\n📋 Step 2: Assigning judges...');
    try {
      await factory.assignJudgesToCase(CASE_ADDRESS);
      console.log('✅ Judges assigned to case');
    } catch (e) {
      console.log('   May already be assigned:', e.message.slice(0, 100));
    }
  }

  // Step 3: Check if we can vote
  const currentState = await courtCase.state();
  if (currentState == 3) { // Deliberating
    console.log('\n📋 Step 3: Case is ready for voting!');
    console.log('   (In a real scenario, the 3 assigned judges would submit votes)');
    
    // Show assigned judges
    try {
      for (let i = 0; i < 3; i++) {
        const judge = await courtCase.judges(i);
        console.log(`   Judge ${i+1}:`, judge);
      }
    } catch (e) {}
  }

  // Step 4: Check final state
  const finalState = await courtCase.state();
  const plaintiffWins = await courtCase.plaintiffWins();
  
  console.log('\n📋 Final Case Status:');
  console.log('   State:', ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'][finalState]);
  
  if (finalState == 4 || finalState == 6) { // Resolved or Defaulted
    console.log('   Verdict:', plaintiffWins ? 'Plaintiff Wins' : 'Defendant Wins');
  }

  // Step 5: Check reputations
  console.log('\n📋 Reputations:');
  const pRep = await registry.getReputation(plaintiff);
  const dRep = await registry.getReputation(defendant);
  console.log(`   Plaintiff: ${pRep}`);
  console.log(`   Defendant: ${dRep}`);

  console.log('\n✨ Demo flow complete!');
  console.log('');
  console.log('View case on Arbiscan:');
  console.log(`https://sepolia.arbiscan.io/address/${CASE_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
