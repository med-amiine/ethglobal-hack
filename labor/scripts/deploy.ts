import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia

async function main() {
  console.log('🚀 Deploying LaborLink contracts...')

  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  // 1. Deploy JobRegistry
  console.log('\n📋 Deploying JobRegistry...')
  const JobRegistry = await ethers.getContractFactory('JobRegistry')
  const jobRegistry = await JobRegistry.deploy()
  await jobRegistry.waitForDeployment()
  const jobRegistryAddress = await jobRegistry.getAddress()
  console.log('✓ JobRegistry deployed at:', jobRegistryAddress)

  // 2. Deploy WorkEscrow (needs JobRegistry and DisputeCourt, deploy DisputeCourt first)
  console.log('\n💰 Deploying DisputeCourt first...')
  const DisputeCourt = await ethers.getContractFactory('DisputeCourt')
  const disrupteCourt = await DisputeCourt.deploy(
    ethers.ZeroAddress, // WorkEscrow address - will update later
    jobRegistryAddress
  )
  await disrupteCourt.waitForDeployment()
  const disruptCourtAddress = await disrupteCourt.getAddress()
  console.log('✓ DisputeCourt deployed at:', disruptCourtAddress)

  // 3. Deploy WorkEscrow
  console.log('\n🔐 Deploying WorkEscrow...')
  const WorkEscrow = await ethers.getContractFactory('WorkEscrow')
  const workEscrow = await WorkEscrow.deploy(
    USDC_ADDRESS,
    jobRegistryAddress,
    disruptCourtAddress
  )
  await workEscrow.waitForDeployment()
  const workEscrowAddress = await workEscrow.getAddress()
  console.log('✓ WorkEscrow deployed at:', workEscrowAddress)

  // 4. Update DisputeCourt with WorkEscrow address
  console.log('\n🔄 Updating DisputeCourt with WorkEscrow address...')
  // DisputeCourt constructor takes WorkEscrow address, but we deployed it as ZeroAddress first
  // We need to redeploy DisputeCourt with correct address, or trust the WorkEscrow was set correctly
  // Let's redeploy for clarity
  const DisputeCourtV2 = await ethers.getContractFactory('DisputeCourt')
  const disruptCourtV2 = await DisputeCourtV2.deploy(
    workEscrowAddress,
    jobRegistryAddress
  )
  await disruptCourtV2.waitForDeployment()
  const disruptCourtV2Address = await disruptCourtV2.getAddress()
  console.log('✓ DisputeCourt V2 deployed at:', disruptCourtV2Address)

  // Update WorkEscrow to reference new DisputeCourt
  const tx = await workEscrow.setDisputeCourt(disruptCourtV2Address)
  await tx.wait()
  console.log('✓ WorkEscrow updated with DisputeCourt address')

  // 5. Save deployment addresses
  const deployments = {
    network: 'base-sepolia',
    chainId: 84532,
    timestamp: new Date().toISOString(),
    addresses: {
      jobRegistry: jobRegistryAddress,
      workEscrow: workEscrowAddress,
      disrupteCourt: disruptCourtV2Address,
      usdc: USDC_ADDRESS,
      deployer: deployer.address,
    },
  }

  const deploymentsPath = path.join(__dirname, '../deployments-base-sepolia.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2))
  console.log('\n✓ Deployments saved to:', deploymentsPath)

  // 6. Display summary
  console.log('\n' + '='.repeat(60))
  console.log('DEPLOYMENT SUMMARY')
  console.log('='.repeat(60))
  console.log('JobRegistry:  ', jobRegistryAddress)
  console.log('WorkEscrow:   ', workEscrowAddress)
  console.log('DisputeCourt: ', disruptCourtV2Address)
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
