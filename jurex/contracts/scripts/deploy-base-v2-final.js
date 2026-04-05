const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('\n🚀 DEPLOYING JUREX V2 TO BASE SEPOLIA (FINAL)\n');
  console.log('Deployer:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  const contracts = {};

  try {
    // 1. JRXToken  
    console.log('1️⃣  JRXToken');
    if (!contracts.JRXToken) {
      const JRXToken = await ethers.getContractFactory('JRXToken');
      const jrx = await JRXToken.deploy({ gasLimit: 3000000 });
      await jrx.waitForDeployment();
      contracts.JRXToken = await jrx.getAddress();
      console.log('   ✓', contracts.JRXToken);
      await delay(3000);
    }

    // 2. CourtRegistry
    console.log('2️⃣  CourtRegistry');
    if (!contracts.CourtRegistry) {
      const CourtRegistry = await ethers.getContractFactory('CourtRegistry');
      const registry = await CourtRegistry.deploy({ gasLimit: 4000000 });
      await registry.waitForDeployment();
      contracts.CourtRegistry = await registry.getAddress();
      console.log('   ✓', contracts.CourtRegistry);
      await delay(3000);
    }

    // 3. CourtCaseFactoryTest
    console.log('3️⃣  CourtCaseFactoryTest');
    if (!contracts.CourtCaseFactoryTest) {
      const Factory = await ethers.getContractFactory('CourtCaseFactoryTest');
      const factory = await Factory.deploy(contracts.CourtRegistry, { gasLimit: 5000000 });
      await factory.waitForDeployment();
      contracts.CourtCaseFactoryTest = await factory.getAddress();
      console.log('   ✓', contracts.CourtCaseFactoryTest);
      await delay(3000);
    }

    // 4. Link factory to registry
    console.log('4️⃣  Linking factory to registry');
    const registry = await ethers.getContractAt('CourtRegistry', contracts.CourtRegistry);
    const tx1 = await registry.setCourtCaseFactory(contracts.CourtCaseFactoryTest);
    await tx1.wait();
    console.log('   ✓ Linked');
    await delay(2000);

    // 5. Set JRX token
    console.log('5️⃣  Setting JRX token');
    const tx2 = await registry.setJRXToken(contracts.JRXToken);
    await tx2.wait();
    console.log('   ✓ Set');
    await delay(2000);

    // 6. AgenticCommerce
    console.log('6️⃣  AgenticCommerce');
    if (!contracts.AgenticCommerce) {
      const ACP = await ethers.getContractFactory('AgenticCommerce');
      const acp = await ACP.deploy({ gasLimit: 4000000 });
      await acp.waitForDeployment();
      contracts.AgenticCommerce = await acp.getAddress();
      console.log('   ✓', contracts.AgenticCommerce);
      await delay(3000);
    }

    // 7. AgentCourtHook
    console.log('7️⃣  AgentCourtHook');
    if (!contracts.AgentCourtHook) {
      const Hook = await ethers.getContractFactory('AgentCourtHook');
      const hook = await Hook.deploy(contracts.CourtRegistry, contracts.AgenticCommerce, { gasLimit: 4000000 });
      await hook.waitForDeployment();
      contracts.AgentCourtHook = await hook.getAddress();
      console.log('   ✓', contracts.AgentCourtHook);
      await delay(2000);
    }

    // 8. Authorize hook
    console.log('8️⃣  Authorizing hook');
    const tx4 = await registry.setCourtHook(contracts.AgentCourtHook);
    await tx4.wait();
    console.log('   ✓ Authorized');

    // Save
    const deployment = {
      network: 'baseSepolia',
      chainId: '84532',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      version: 'v2',
      contracts
    };

    fs.writeFileSync(
      path.join(__dirname, '..', 'deployments-base-sepolia-v2.json'),
      JSON.stringify(deployment, null, 2)
    );

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEPLOYMENT COMPLETE');
    console.log('='.repeat(70));
    Object.entries(contracts).forEach(([name, addr]) => {
      console.log(`${name.padEnd(25)} ${addr}`);
    });
    console.log('='.repeat(70) + '\n');

  } catch(e) {
    console.error('\n❌ Error:', e.message);
    throw e;
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
