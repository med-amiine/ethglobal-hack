const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const CASE_ADDRESS = fs.existsSync(path.join(__dirname, '..', '.test-case'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.test-case'), 'utf8')).caseAddress
  : null;

async function main() {
  if (!CASE_ADDRESS) {
    console.log('❌ No active case');
    process.exit(1);
  }
  
  // Load judges
  const judgesPath = path.join(__dirname, '..', '.judges');
  if (!fs.existsSync(judgesPath)) {
    console.log('❌ No judges assigned. Run assign-judges.js first');
    process.exit(1);
  }
  
  const judgesInfo = JSON.parse(fs.readFileSync(judgesPath, 'utf8'));
  const judges = judgesInfo.judges;
  
  console.log('⚖️  JUDGES VOTING');
  console.log('Case:', CASE_ADDRESS);
  console.log('');
  
  const CourtCaseTest = await ethers.getContractFactory('CourtCaseTest');
  
  // Vote 1: Plaintiff wins (Judge 1)
  console.log('🗳️  Judge 1 voting: Plaintiff Wins');
  const judge1Signer = new ethers.Wallet(judges[0].privateKey, ethers.provider);
  const case1 = CourtCaseTest.attach(CASE_ADDRESS).connect(judge1Signer);
  const tx1 = await case1.submitVote(true); // true = plaintiff wins
  await tx1.wait();
  console.log('✅ Vote 1 submitted. Tx:', tx1.hash);
  
  // Check if verdict rendered
  let state = await case1.state();
  const states = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'];
  
  if (state === 4n) { // Resolved
    console.log('\n🎉 VERDICT RENDERED after 1 vote! (Auto-default)');
  } else {
    // Vote 2: Plaintiff wins (Judge 2) - this should trigger majority
    console.log('\n🗳️  Judge 2 voting: Plaintiff Wins');
    const judge2Signer = new ethers.Wallet(judges[1].privateKey, ethers.provider);
    const case2 = CourtCaseTest.attach(CASE_ADDRESS).connect(judge2Signer);
    const tx2 = await case2.submitVote(true);
    await tx2.wait();
    console.log('✅ Vote 2 submitted. Tx:', tx2.hash);
  }
  
  // Check final state
  const finalCase = CourtCaseTest.attach(CASE_ADDRESS);
  const finalState = await finalCase.state();
  const plaintiffWins = await finalCase.plaintiffWins();
  
  console.log('\n' + '='.repeat(40));
  console.log('📊 FINAL RESULT');
  console.log('='.repeat(40));
  console.log('State:', states[finalState]);
  console.log('Plaintiff Wins:', plaintiffWins);
  
  if (finalState === 4n) { // Resolved
    const verdictReason = await finalCase.verdictReason();
    console.log('Reason:', verdictReason);
    
    // Check reputations
    const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
    const registry = CourtRegistry.attach('0xBdEA6Dcd8DF24B7719F857a62EC4Ea07F0BFdd5b');
    
    const plaintiff = await finalCase.plaintiff();
    const defendant = await finalCase.defendant();
    
    const plaintiffRep = await registry.getReputation(plaintiff);
    const defendantRep = await registry.getReputation(defendant);
    
    console.log('\n🏆 REPUTATIONS:');
    console.log('   Plaintiff:', plaintiffRep.toString(), '(+15)');
    console.log('   Defendant:', defendantRep.toString(), '(-15)');
    
    console.log('\n✨ DEMO COMPLETE!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
