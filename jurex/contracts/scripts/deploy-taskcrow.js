const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('\n📦 DEPLOYING TASKESCROW\n');
  
  const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const FACTORY = '0xD07fbDE7E5eC68e5aa863DE4D077Fc0350dE18c6';
  
  try {
    const TaskEscrow = await ethers.getContractFactory('TaskEscrow');
    const escrow = await TaskEscrow.deploy(FACTORY, USDC_BASE_SEPOLIA, { gasLimit: 2000000 });
    await escrow.waitForDeployment();
    const addr = await escrow.getAddress();
    
    console.log('✅ TaskEscrow deployed:', addr);
    console.log('   Factory:', FACTORY);
    console.log('   USDC:', USDC_BASE_SEPOLIA);
    
  } catch(e) {
    console.error('❌ Error:', e.message);
    throw e;
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
