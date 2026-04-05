const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('🔑 Creating Defendant Wallet...');
  console.log('Plaintiff/Deployer:', deployer.address);
  
  // Create random wallet for defendant
  const defendantWallet = ethers.Wallet.createRandom();
  console.log('\n📋 DEFENDANT WALLET CREATED:');
  console.log('   Address:', defendantWallet.address);
  console.log('   Private Key:', defendantWallet.privateKey);
  console.log('\n⚠️  SAVE THIS PRIVATE KEY SECURELY');
  
  // Fund the defendant wallet (0.02 ETH for stake + gas)
  const fundAmount = ethers.parseEther('0.025');
  console.log('\n💸 Funding defendant with', ethers.formatEther(fundAmount), 'ETH...');
  
  const tx = await deployer.sendTransaction({
    to: defendantWallet.address,
    value: fundAmount
  });
  await tx.wait();
  
  console.log('✅ Funded! Tx:', tx.hash);
  
  // Save wallet info
  const walletInfo = {
    network: 'arbitrumSepolia',
    createdAt: new Date().toISOString(),
    defendant: {
      address: defendantWallet.address,
      privateKey: defendantWallet.privateKey,
      funded: ethers.formatEther(fundAmount) + ' ETH',
      purpose: 'Defendant in Agent Court case'
    },
    transactions: {
      funding: tx.hash
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', '.defendant-wallet'),
    JSON.stringify(walletInfo, null, 2)
  );
  
  console.log('\n💾 Saved to .defendant-wallet (DO NOT COMMIT)');
  console.log('\nNext: Register as agent → Respond to case');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
