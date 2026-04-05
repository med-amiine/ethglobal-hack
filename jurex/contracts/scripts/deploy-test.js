const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('DEPLOYING TEST CONTRACTS (Tiny Stakes)');
  console.log('Deployer:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  console.log('');

  // 1. Deploy JRXToken
  console.log('Deploying JRXToken...');
  const JRXToken = await ethers.getContractFactory('JRXToken');
  const jrx = await JRXToken.deploy();
  await jrx.waitForDeployment();
  const jrxAddress = await jrx.getAddress();
  console.log('JRXToken:', jrxAddress);

  // 2. Deploy CourtRegistry
  console.log('\nDeploying CourtRegistry...');
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = await CourtRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log('CourtRegistry:', registryAddress);

  // 3. Deploy CourtCaseFactoryTest
  console.log('\nDeploying CourtCaseFactoryTest (0.0001 ETH base fee)...');
  const CourtCaseFactoryTest = await ethers.getContractFactory('CourtCaseFactoryTest');
  const factory = await CourtCaseFactoryTest.deploy(registryAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log('CourtCaseFactoryTest:', factoryAddress);

  // 4. Link factory to registry
  console.log('\nLinking factory to registry...');
  const tx1 = await registry.setCourtCaseFactory(factoryAddress);
  await tx1.wait();
  console.log('Factory linked');

  // 5. Set JRX token in registry
  console.log('\nSetting JRX token in registry...');
  const tx2 = await registry.setJRXToken(jrxAddress);
  await tx2.wait();
  console.log('JRX token set');

  // 6. Set treasury (deployer address for now)
  console.log('\nSetting treasury...');
  const tx3 = await registry.setTreasury(deployer.address);
  await tx3.wait();
  console.log('Treasury set to deployer:', deployer.address);

  // 7. Deploy AgenticCommerce (ERC-8183 job escrow)
  console.log('\nDeploying AgenticCommerce (ERC-8183 job escrow)...');
  const AgenticCommerce = await ethers.getContractFactory('AgenticCommerce');
  const acp = await AgenticCommerce.deploy();
  await acp.waitForDeployment();
  const acpAddress = await acp.getAddress();
  console.log('AgenticCommerce:', acpAddress);

  // 8. Deploy AgentCourtHook — wired to the real ACP contract
  console.log('\nDeploying AgentCourtHook (ERC-8183 hook)...');
  const AgentCourtHook = await ethers.getContractFactory('AgentCourtHook');
  const hook = await AgentCourtHook.deploy(registryAddress, acpAddress);
  await hook.waitForDeployment();
  const hookAddress = await hook.getAddress();
  console.log('AgentCourtHook:', hookAddress);

  // 9. Authorize hook in registry
  console.log('\nAuthorizing hook in registry...');
  const tx4 = await registry.setCourtHook(hookAddress);
  await tx4.wait();
  console.log('Hook authorized in CourtRegistry');

  // Save deployment
  const deploymentInfo = {
    network: 'arbitrumSepolia',
    chainId: '421614',
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    type: 'TEST (tiny stakes)',
    contracts: {
      JRXToken: jrxAddress,
      CourtRegistry: registryAddress,
      CourtCaseFactoryTest: factoryAddress,
      AgenticCommerce: acpAddress,
      AgentCourtHook: hookAddress
    },
    staking: {
      baseFee: '0.0001 ETH',
      plaintiffStake: '0.0002 ETH',
      defendantStake: '0.0001 ETH',
      deadline: '5 minutes',
      judgeStakeMin: '1000 JRX',
      slashAmount: '100 JRX'
    }
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'deployments-test.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\n' + '='.repeat(50));
  console.log('TEST DEPLOYMENT COMPLETE');
  console.log('='.repeat(50));
  console.log('JRXToken:            ', jrxAddress);
  console.log('CourtRegistry:       ', registryAddress);
  console.log('CourtCaseFactoryTest:', factoryAddress);
  console.log('AgenticCommerce:     ', acpAddress);
  console.log('AgentCourtHook:      ', hookAddress);
  console.log('');
  console.log('Stakes: Plaintiff 0.0002 ETH | Defendant 0.0001 ETH');
  console.log('Deadline: 5 minutes');
  console.log('Judge stake min: 1,000 JRX');
  console.log('');
  console.log('Saved to deployments-test.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
