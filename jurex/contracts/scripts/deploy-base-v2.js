const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('\n🚀 DEPLOYING JUREX V2 TO BASE SEPOLIA\n');
  console.log('Deployer:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log('Current nonce:', nonce, '\n');

  try {
    // 1. Deploy JRXToken
    console.log('1️⃣  Deploying JRXToken...');
    const JRXToken = await ethers.getContractFactory('JRXToken');
    const jrx = await JRXToken.deploy({ gasLimit: 3000000 });
    const jrxTx = await jrx.waitForDeployment();
    const jrxAddress = await jrx.getAddress();
    console.log('   ✓ JRXToken:', jrxAddress);
    await delay(3000);

    // 2. Deploy CourtRegistry
    console.log('\n2️⃣  Deploying CourtRegistry...');
    const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
    const registry = await CourtRegistry.deploy({ gasLimit: 4000000 });
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log('   ✓ CourtRegistry:', registryAddress);
    await delay(3000);

    // 3. Deploy CourtCaseFactoryTest
    console.log('\n3️⃣  Deploying CourtCaseFactoryTest...');
    const CourtCaseFactoryTest = await ethers.getContractFactory('CourtCaseFactoryTest');
    const factory = await CourtCaseFactoryTest.deploy(registryAddress, { gasLimit: 4000000 });
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log('   ✓ CourtCaseFactoryTest:', factoryAddress);
    await delay(3000);

    // 4. Link factory to registry
    console.log('\n4️⃣  Linking factory to registry...');
    const tx1 = await registry.setCourtCaseFactory(factoryAddress);
    await tx1.wait();
    console.log('   ✓ Factory linked');
    await delay(2000);

    // 5. Set JRX token in registry
    console.log('\n5️⃣  Setting JRX token in registry...');
    const tx2 = await registry.setJRXToken(jrxAddress);
    await tx2.wait();
    console.log('   ✓ JRX token set');
    await delay(2000);

    // 6. Deploy AgenticCommerce
    console.log('\n6️⃣  Deploying AgenticCommerce...');
    const AgenticCommerce = await ethers.getContractFactory('AgenticCommerce');
    const acp = await AgenticCommerce.deploy({ gasLimit: 4000000 });
    await acp.waitForDeployment();
    const acpAddress = await acp.getAddress();
    console.log('   ✓ AgenticCommerce:', acpAddress);
    await delay(3000);

    // 7. Deploy AgentCourtHook
    console.log('\n7️⃣  Deploying AgentCourtHook...');
    const AgentCourtHook = await ethers.getContractFactory('AgentCourtHook');
    const hook = await AgentCourtHook.deploy(registryAddress, acpAddress, { gasLimit: 4000000 });
    await hook.waitForDeployment();
    const hookAddress = await hook.getAddress();
    console.log('   ✓ AgentCourtHook:', hookAddress);
    await delay(2000);

    // 8. Authorize hook
    console.log('\n8️⃣  Authorizing hook in registry...');
    const tx4 = await registry.setCourtHook(hookAddress);
    await tx4.wait();
    console.log('   ✓ Hook authorized');

    // Save deployment
    const deploymentInfo = {
      network: 'baseSepolia',
      chainId: '84532',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      version: 'v2',
      contracts: {
        JRXToken: jrxAddress,
        CourtRegistry: registryAddress,
        CourtCaseFactoryTest: factoryAddress,
        AgenticCommerce: acpAddress,
        AgentCourtHook: hookAddress
      }
    };

    fs.writeFileSync(
      path.join(__dirname, '..', 'deployments-base-sepolia-v2.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEPLOYMENT COMPLETE - BASE SEPOLIA');
    console.log('='.repeat(70));
    console.log('JRXToken:            ', jrxAddress);
    console.log('CourtRegistry:       ', registryAddress);
    console.log('CourtCaseFactoryTest:', factoryAddress);
    console.log('AgenticCommerce:     ', acpAddress);
    console.log('AgentCourtHook:      ', hookAddress);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
