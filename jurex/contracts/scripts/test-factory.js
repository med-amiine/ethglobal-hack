const { ethers } = require('hardhat');

async function main() {
  const registryAddress = '0xe7F2989FB303f50502e225754beC1d83B91C4FC3';
  const [deployer] = await ethers.getSigners();
  
  console.log('\n🧪 Testing CourtCaseFactoryTest deployment');
  console.log('Registry:', registryAddress);
  console.log('Deployer:', deployer.address);
  
  try {
    const Factory = await ethers.getContractFactory('CourtCaseFactoryTest');
    console.log('Factory contract loaded');
    
    const factory = await Factory.deploy(registryAddress, { gasLimit: 5000000 });
    console.log('Deploy TX sent');
    
    const receipt = await factory.waitForDeployment();
    const addr = await factory.getAddress();
    console.log('✅ Deployed:', addr);
  } catch(e) {
    console.error('❌ Error:', e.message);
    if (e.data) console.error('Data:', e.data);
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
