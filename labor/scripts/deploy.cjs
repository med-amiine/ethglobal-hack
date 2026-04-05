const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Deploying LaborLink contracts...')

  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  // 1. Deploy JobRegistry
  console.log('\n📋 Deploying JobRegistry...')
  const JobRegistry = await ethers.getContractFactory('JobRegistry')
  const jobRegistry = await JobRegistry.deploy()
  await jobRegistry.deployed()
  console.log('✓ JobRegistry deployed at:', jobRegistry.address)

  // 2. Deploy DisputeCourt first (with temporary WorkEscrow address)
  console.log('\n⚖️ Deploying DisputeCourt...')
  const DisputeCourt = await ethers.getContractFactory('DisputeCourt')
  const disrupteCourt = await DisputeCourt.deploy(
    ethers.constants.AddressZero,
    jobRegistry.address
  )
  await disrupteCourt.deployed()
  console.log('✓ DisputeCourt deployed at:', disrupteCourt.address)

  // 3. Deploy WorkEscrow
  console.log('\n💰 Deploying WorkEscrow...')
  const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  const WorkEscrow = await ethers.getContractFactory('WorkEscrow')
  const workEscrow = await WorkEscrow.deploy(
    USDC_ADDRESS,
    jobRegistry.address,
    disrupteCourt.address
  )
  await workEscrow.deployed()
  console.log('✓ WorkEscrow deployed at:', workEscrow.address)

  // 4. Redeploy DisputeCourt with correct WorkEscrow address
  console.log('\n🔄 Redeploying DisputeCourt with WorkEscrow address...')
  const disruptCourtV2 = await DisputeCourt.deploy(
    workEscrow.address,
    jobRegistry.address
  )
  await disruptCourtV2.deployed()
  console.log('✓ DisputeCourt V2 deployed at:', disruptCourtV2.address)

  // 5. Update WorkEscrow to reference new DisputeCourt
  const tx = await workEscrow.setDisputeCourt(disruptCourtV2.address)
  await tx.wait()
  console.log('✓ WorkEscrow updated with DisputeCourt address')

  // 6. Save deployment addresses
  const deployments = {
    network: 'base-sepolia',
    chainId: 84532,
    timestamp: new Date().toISOString(),
    addresses: {
      jobRegistry: jobRegistry.address,
      workEscrow: workEscrow.address,
      disrupteCourt: disruptCourtV2.address,
      usdc: USDC_ADDRESS,
      deployer: deployer.address,
    },
  }

  const deploymentsPath = path.join(__dirname, '../deployments-base-sepolia.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))
  console.log('\n✓ Deployments saved to:', deploymentsPath)

  // 7. Display summary
  console.log('\n' + '='.repeat(60))
  console.log('DEPLOYMENT SUMMARY')
  console.log('='.repeat(60))
  console.log('JobRegistry:  ', jobRegistry.address)
  console.log('WorkEscrow:   ', workEscrow.address)
  console.log('DisputeCourt: ', disruptCourtV2.address)
  console.log('USDC:         ', USDC_ADDRESS)
  console.log('Deployer:     ', deployer.address)
  console.log('='.repeat(60))

  console.log(
    '\n💡 Next steps:\n' +
      '1. Update .env.local with contract addresses\n' +
      '2. Verify contracts on Basescan (optional)\n' +
      '3. Fund the deployer wallet with testnet USDC\n' +
      '4. Run the demo flow'
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
