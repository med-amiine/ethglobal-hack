const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Check balance first
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH');
  
  // Fund amount: stake (0.01) + minimal gas (~0.0005) = ~0.0105 ETH
  const fundAmount = ethers.parseEther('0.011');
  
  if (balance < fundAmount + ethers.parseEther('0.0015')) {
    console.log('\n⚠️  Insufficient funds to fund defendant');
    console.log('   Need: ~0.0125 ETH (funding + gas buffer)');
    console.log('   Have:', ethers.formatEther(balance), 'ETH');
    
    // Read existing wallet if created
    const walletPath = path.join(__dirname, '..', '.defendant-wallet');
    if (fs.existsSync(walletPath)) {
      const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      console.log('\n📋 EXISTING DEFENDANT WALLET:');
      console.log('   Address:', walletInfo.defendant.address);
      console.log('   Private Key:', walletInfo.defendant.privateKey);
      console.log('\n💡 OPTIONS:');
      console.log('   1. Fund this wallet externally (need 0.011 ETH)');
      console.log('   2. Get more Arbitrum Sepolia ETH for deployer');
      console.log('   3. Use the auto-default path (no defendant needed)');
    }
    process.exit(0);
  }
  
  console.log('\n💸 Funding defendant with', ethers.formatEther(fundAmount), 'ETH...');
  
  // Load existing wallet or create new
  const walletPath = path.join(__dirname, '..', '.defendant-wallet');
  let defendantAddress;
  let defendantKey;
  
  if (fs.existsSync(walletPath)) {
    const walletInfo = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    defendantAddress = walletInfo.defendant.address;
    defendantKey = walletInfo.defendant.privateKey;
    console.log('Using existing wallet:', defendantAddress);
  } else {
    const defendantWallet = ethers.Wallet.createRandom();
    defendantAddress = defendantWallet.address;
    defendantKey = defendantWallet.privateKey;
    console.log('\n📋 NEW DEFENDANT WALLET:');
    console.log('   Address:', defendantAddress);
    console.log('   Private Key:', defendantKey);
  }
  
  const tx = await deployer.sendTransaction({
    to: defendantAddress,
    value: fundAmount
  });
  await tx.wait();
  
  console.log('✅ Funded! Tx:', tx.hash);
  
  // Save wallet info
  const walletInfo = {
    network: 'arbitrumSepolia',
    updatedAt: new Date().toISOString(),
    defendant: {
      address: defendantAddress,
      privateKey: defendantKey,
      funded: ethers.formatEther(fundAmount) + ' ETH',
      fundingTx: tx.hash
    }
  };
  
  fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
  console.log('\n💾 Saved to .defendant-wallet');
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Register defendant: npx hardhat run scripts/register-defendant.js --network arbitrumSepolia');
  console.log('   2. Respond to case: npx hardhat run scripts/respond-case.js --network arbitrumSepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
