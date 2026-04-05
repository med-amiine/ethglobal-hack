const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Load deployment info
const deploymentPath = path.join(__dirname, '..', 'deployments.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const REGISTRY_ADDRESS = deployment.contracts.CourtRegistry;
const FACTORY_ADDRESS = deployment.contracts.CourtCaseFactory;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('🎭 AGENT COURT DEMO — Arbitrum Sepolia');
  console.log('=======================================');
  console.log('Deployer/Plaintiff:', deployer.address);
  console.log('');

  // Attach to contracts
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = CourtRegistry.attach(REGISTRY_ADDRESS);
  
  const CourtCaseFactory = await ethers.getContractFactory('CourtCaseFactory');
  const factory = CourtCaseFactory.attach(FACTORY_ADDRESS);

  // Step 1: Register deployer as plaintiff if not already
  console.log('📋 Step 1: Registering plaintiff...');
  let plaintiffRep = await registry.getReputation(deployer.address).catch(() => 0);
  
  if (plaintiffRep == 0) {
    const tx = await registry.registerAgent(
      deployer.address, 
      ethers.keccak256(ethers.toUtf8Bytes('agent-court-plaintiff'))
    );
    await tx.wait();
    console.log('✅ Plaintiff registered');
  } else {
    console.log('✅ Plaintiff already registered');
  }

  // Create a defendant address (we'll register this too)
  const defendantWallet = ethers.Wallet.createRandom();
  console.log('\n📋 Step 2: Registering defendant...');
  console.log('   Defendant:', defendantWallet.address);
  
  let defendantRep = await registry.getReputation(defendantWallet.address).catch(() => 0);
  if (defendantRep == 0) {
    const tx = await registry.registerAgent(
      defendantWallet.address,
      ethers.keccak256(ethers.toUtf8Bytes('agent-court-defendant'))
    );
    await tx.wait();
    console.log('✅ Defendant registered');
  }

  // Check reputations
  plaintiffRep = await registry.getReputation(deployer.address);
  defendantRep = await registry.getReputation(defendantWallet.address);
  console.log(`\n📊 Reputations:`);
  console.log(`   Plaintiff: ${plaintiffRep}`);
  console.log(`   Defendant: ${defendantRep}`);

  // Step 3: File a case
  console.log('\n📋 Step 3: Filing case...');
  const BASE_FEE = ethers.parseEther('0.01');  // 0.01 ETH base fee
  
  const tx = await factory.fileNewCase(
    defendantWallet.address,
    'Service not delivered - promised AI agent integration module',
    'QmEvidenceHashDemo',
    { value: BASE_FEE * 2n }  // 0.02 ETH stake
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(l => l.fragment?.name === 'CaseCreated');
  const caseAddress = event.args.caseAddress;
  
  console.log('✅ Case filed!');
  console.log('   Address:', caseAddress);
  console.log('   Tx Hash:', tx.hash);
  console.log('   Explorer: https://sepolia.arbiscan.io/tx/' + tx.hash);

  // Check case state
  const CourtCase = await ethers.getContractFactory('CourtCase');
  const courtCase = CourtCase.attach(caseAddress);
  
  const state = await courtCase.state();
  const plaintiffStake = await courtCase.plaintiffStake();
  console.log(`\n📋 Case Status:`);
  console.log(`   State: ${['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted'][state]}`);
  console.log(`   Plaintiff Stake: ${ethers.formatEther(plaintiffStake)} ETH`);
  console.log(`   Response Deadline: ${new Date(Number(await courtCase.deadlineToRespond()) * 1000).toISOString()}`);

  // Save demo results
  const demoResults = {
    network: deployment.network,
    chainId: deployment.chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      registry: REGISTRY_ADDRESS,
      factory: FACTORY_ADDRESS,
      case: caseAddress
    },
    agents: {
      plaintiff: deployer.address,
      defendant: defendantWallet.address
    },
    transactions: {
      filing: tx.hash
    },
    explorerUrls: {
      registry: 'https://sepolia.arbiscan.io/address/' + REGISTRY_ADDRESS,
      factory: 'https://sepolia.arbiscan.io/address/' + FACTORY_ADDRESS,
      case: 'https://sepolia.arbiscan.io/address/' + caseAddress,
      filingTx: 'https://sepolia.arbiscan.io/tx/' + tx.hash
    }
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'demo-results.json'),
    JSON.stringify(demoResults, null, 2)
  );

  console.log('\n✨ DEMO COMPLETE — Case Filed and Active');
  console.log('=========================================');
  console.log('');
  console.log('🎯 DEPLOYED CONTRACTS:');
  console.log('   Registry:', demoResults.explorerUrls.registry);
  console.log('   Factory:', demoResults.explorerUrls.factory);
  console.log('   Case:', demoResults.explorerUrls.case);
  console.log('');
  console.log('Results saved to demo-results.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
