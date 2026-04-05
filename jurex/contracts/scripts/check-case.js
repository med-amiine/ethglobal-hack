const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Load deployment info
const deploymentPath = path.join(__dirname, '..', 'deployments.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const CASE_ADDRESS = '0x483b5cdbf2851E9106eC41A75d92f353aebF0007';

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('🎭 AGENT COURT — Case Status Check');
  console.log('=======================================');
  console.log('Network: Arbitrum Sepolia');
  console.log('Case:', CASE_ADDRESS);
  console.log('');

  const CourtCase = await ethers.getContractFactory('CourtCase');
  const courtCase = CourtCase.attach(CASE_ADDRESS);
  
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  
  const state = await courtCase.state();
  const plaintiff = await courtCase.plaintiff();
  const defendant = await courtCase.defendant();
  const plaintiffStake = await courtCase.plaintiffStake();
  const defendantStake = await courtCase.defendantStake();
  const deadline = await courtCase.deadlineToRespond();
  const votesPlaintiff = await courtCase.votesForPlaintiff();
  const votesDefendant = await courtCase.votesForDefendant();
  
  console.log('📊 CASE STATUS:');
  console.log('   State:', states[state]);
  console.log('   Plaintiff:', plaintiff);
  console.log('   Defendant:', defendant);
  console.log('   Plaintiff Stake:', ethers.formatEther(plaintiffStake), 'ETH');
  console.log('   Defendant Stake:', ethers.formatEther(defendantStake), 'ETH');
  console.log('   Response Deadline:', new Date(Number(deadline) * 1000).toISOString());
  console.log('');
  console.log('⚖️  VOTING:');
  console.log('   Votes for Plaintiff:', votesPlaintiff.toString());
  console.log('   Votes for Defendant:', votesDefendant.toString());
  console.log('');
  
  const now = Math.floor(Date.now() / 1000);
  if (state === 1n && now > Number(deadline)) {
    console.log('⏰ DEADLINE PASSED — Can trigger default judgment');
    console.log('   Run: npx hardhat run scripts/trigger-default.js --network arbitrumSepolia');
  }
  
  console.log('');
  console.log('🔗 Explorer: https://sepolia.arbiscan.io/address/' + CASE_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
