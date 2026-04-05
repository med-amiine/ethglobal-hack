const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy CourtRegistry
  console.log('\n📜 Deploying CourtRegistry...');
  const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
  const registry = await CourtRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log('✅ CourtRegistry deployed to:', registryAddress);

  // Deploy CourtCaseFactory
  console.log('\n📜 Deploying CourtCaseFactory...');
  const CourtCaseFactory = await ethers.getContractFactory('CourtCaseFactory');
  const factory = await CourtCaseFactory.deploy(registryAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log('✅ CourtCaseFactory deployed to:', factoryAddress);

  // Set factory in registry
  console.log('\n🔗 Setting factory in registry...');
  await registry.setCourtCaseFactory(factoryAddress);
  console.log('✅ Factory linked to registry');

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CourtRegistry: registryAddress,
      CourtCaseFactory: factoryAddress,
    },
  };

  const deploymentPath = path.join(__dirname, '..', 'deployments.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Deployment info saved to deployments.json');

  // Log for submission
  console.log('\n' + '='.repeat(60));
  console.log('🎯 DEPLOYMENT SUMMARY FOR SYNTHESIS SUBMISSION');
  console.log('='.repeat(60));
  console.log('CourtRegistry.sol:', registryAddress);
  console.log('CourtCaseFactory.sol:', factoryAddress);
  console.log('CourtCase.sol: Deployed per-case by factory');
  console.log('='.repeat(60));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
