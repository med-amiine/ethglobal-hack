/**
 * e2e-test.js — End-to-end test for Agent Court on Arbitrum Sepolia
 *
 * Run with: node scripts/e2e-test.js
 *
 * Uses ethers v6 (bundled via hardhat-toolbox in node_modules).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// ─── Contract addresses ──────────────────────────────────────────────────────
const JRX_ADDRESS      = '0x0a8d15cF0675Fed01C58E1D8496626f5642b0362';
const REGISTRY_ADDRESS = '0x947E8b85863E49EFF0421542078967A29E2c8DD9';
const FACTORY_ADDRESS  = '0xd3274054A6FAA8c133c03007C8449b6D8Ab70bF3';
const RPC_URL          = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY      = process.env.PRIVATE_KEY;

// ─── Load ABIs from compiled artifacts ───────────────────────────────────────
const artifactsBase = path.join(__dirname, '..', 'artifacts', 'contracts');
const JRX_ABI      = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'JRXToken.sol/JRXToken.json'))).abi;
const REGISTRY_ABI = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtRegistry.sol/CourtRegistry.json'))).abi;
const FACTORY_ABI  = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtCaseFactoryTest.sol/CourtCaseFactoryTest.json'))).abi;
const CASE_ABI     = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtCaseTest.sol/CourtCaseTest.json'))).abi;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PASS = '  [PASS]';
const FAIL = '  [FAIL]';
const INFO = '  [INFO]';

function result(ok, label, detail = '') {
  const tag = ok ? PASS : FAIL;
  console.log(`${tag} ${label}${detail ? ' — ' + detail : ''}`);
  return ok;
}

const STATES = ['Filed', 'Summoned', 'Active', 'Deliberating', 'Resolved', 'Dismissed', 'Defaulted', 'Appealed'];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  AGENT COURT — End-to-End Test (Arbitrum Sepolia)');
  console.log('='.repeat(60));

  if (!PRIVATE_KEY) {
    console.error('ERROR: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployer = wallet.address;

  console.log(`\nDeployer: ${deployer}`);
  console.log(`RPC:      ${RPC_URL}\n`);

  // ─── Step 1: ETH balance ──────────────────────────────────────────────────
  console.log('── Step 1: ETH balance ──');
  const ethBal = await provider.getBalance(deployer);
  const ethBalF = ethers.formatEther(ethBal);
  const hasEth = ethBal > ethers.parseEther('0.001');
  result(hasEth, 'ETH balance', `${ethBalF} ETH${hasEth ? '' : ' (too low — need at least 0.001 ETH)'}`);

  if (!hasEth) {
    console.error('\nFATAL: Not enough ETH. Bridge some ETH to Arbitrum Sepolia first.');
    process.exit(1);
  }

  // ─── Step 2: JRX balance ─────────────────────────────────────────────────
  console.log('\n── Step 2: JRX token balance ──');
  const jrx = new ethers.Contract(JRX_ADDRESS, JRX_ABI, wallet);

  let jrxBal;
  try {
    jrxBal = await jrx.balanceOf(deployer);
    const jrxBalF = ethers.formatUnits(jrxBal, 18);
    const hasJrx = jrxBal >= ethers.parseUnits('1000', 18);
    result(true, 'JRX.balanceOf(deployer)', `${jrxBalF} JRX`);
    if (!hasJrx) {
      console.log(`${FAIL} Need at least 1,000 JRX to stake as judge`);
    }
  } catch (e) {
    result(false, 'JRX.balanceOf(deployer)', e.message);
    console.error('\nFATAL: Cannot read JRX contract');
    process.exit(1);
  }

  // ─── Step 3: Check if deployer is already staked ─────────────────────────
  console.log('\n── Step 3: Check existing judge stake ──');
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
  let existingStake;
  try {
    existingStake = await registry.judgeStakes(deployer);
    result(true, 'registry.judgeStakes(deployer)', `${ethers.formatUnits(existingStake, 18)} JRX`);
  } catch (e) {
    result(false, 'registry.judgeStakes(deployer)', e.message);
    existingStake = 0n;
  }

  // ─── Step 4: Approve registry to spend JRX (if needed) ───────────────────
  const STAKE_AMOUNT = ethers.parseUnits('1000', 18);

  if (existingStake < STAKE_AMOUNT) {
    console.log('\n── Step 4: Approve JRX spend ──');
    try {
      const allowance = await jrx.allowance(deployer, REGISTRY_ADDRESS);
      console.log(`${INFO} Current allowance: ${ethers.formatUnits(allowance, 18)} JRX`);

      if (allowance < STAKE_AMOUNT) {
        console.log(`${INFO} Sending approve tx...`);
        const approveTx = await jrx.approve(REGISTRY_ADDRESS, STAKE_AMOUNT);
        console.log(`${INFO} approve tx: ${approveTx.hash}`);
        const approveReceipt = await approveTx.wait();
        result(approveReceipt.status === 1, 'JRX.approve(registry, 1000 JRX)');
      } else {
        result(true, 'JRX allowance already sufficient', `${ethers.formatUnits(allowance, 18)} JRX`);
      }
    } catch (e) {
      result(false, 'JRX.approve()', e.message);
    }

    // ─── Step 5: Stake as judge ─────────────────────────────────────────────
    console.log('\n── Step 5: Stake as judge ──');
    try {
      const neededToStake = STAKE_AMOUNT - existingStake;
      console.log(`${INFO} Staking ${ethers.formatUnits(neededToStake, 18)} JRX...`);
      const stakeTx = await registry.stakeAsJudge(neededToStake);
      console.log(`${INFO} stakeAsJudge tx: ${stakeTx.hash}`);
      const stakeReceipt = await stakeTx.wait();
      result(stakeReceipt.status === 1, 'registry.stakeAsJudge()', `tx: ${stakeTx.hash}`);
    } catch (e) {
      result(false, 'registry.stakeAsJudge()', e.message);
    }
  } else {
    console.log(`\n── Steps 4-5: Skipped (deployer already has ${ethers.formatUnits(existingStake, 18)} JRX staked) ──`);
  }

  // ─── Step 6: Verify judge stake ──────────────────────────────────────────
  console.log('\n── Step 6: Verify judge stake ──');
  try {
    const newStake = await registry.judgeStakes(deployer);
    const stakeOk = newStake >= STAKE_AMOUNT;
    result(stakeOk, 'registry.judgeStakes(deployer)', `${ethers.formatUnits(newStake, 18)} JRX`);
  } catch (e) {
    result(false, 'registry.judgeStakes(deployer) after stake', e.message);
  }

  // ─── Step 7: Check judge pool size ───────────────────────────────────────
  console.log('\n── Step 7: Judge pool size ──');
  try {
    const poolSize = await registry.getJudgePoolSize();
    result(poolSize > 0n, 'registry.getJudgePoolSize()', `${poolSize.toString()} judge(s) in pool`);
  } catch (e) {
    result(false, 'registry.getJudgePoolSize()', e.message);
  }

  // ─── Step 8: Get eligible judges for a random case ───────────────────────
  console.log('\n── Step 8: Eligible judges ──');
  const randomAddr1 = ethers.Wallet.createRandom().address;
  const randomAddr2 = ethers.Wallet.createRandom().address;
  try {
    const eligible = await registry.getEligibleJudges(randomAddr1, randomAddr2);
    result(eligible.length > 0, 'registry.getEligibleJudges(rand, rand)', `${eligible.length} eligible judge(s)`);
    console.log(`${INFO} Eligible judges: [${eligible.join(', ')}]`);
  } catch (e) {
    result(false, 'registry.getEligibleJudges()', e.message);
  }

  // ─── Step 9: File a test case ─────────────────────────────────────────────
  console.log('\n── Step 9: File a test case ──');
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

  // Use a deterministic random defendant (different from deployer)
  const defendantWallet = ethers.Wallet.fromPhrase(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );
  const defendant = defendantWallet.address;
  console.log(`${INFO} Defendant (BIP-39 test wallet): ${defendant}`);

  let caseAddress;
  try {
    const fileTx = await factory.fileNewCase(
      defendant,
      'E2E automated test claim — ignore',
      'QmE2ETestHash000000000000000000000000000000000001',
      { value: ethers.parseEther('0.0002') }
    );
    console.log(`${INFO} fileNewCase tx: ${fileTx.hash}`);
    const fileReceipt = await fileTx.wait();
    result(fileReceipt.status === 1, 'factory.fileNewCase()', `tx: ${fileTx.hash}`);
    console.log(`${INFO} Explorer: https://sepolia.arbiscan.io/tx/${fileTx.hash}`);

    // Parse CaseCreated event to get case address
    const iface = new ethers.Interface(FACTORY_ABI);
    for (const log of fileReceipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'CaseCreated') {
          caseAddress = parsed.args.caseAddress;
          break;
        }
      } catch (_) {}
    }

    if (caseAddress) {
      result(true, 'CaseCreated event parsed', `Case address: ${caseAddress}`);
      console.log(`${INFO} Case explorer: https://sepolia.arbiscan.io/address/${caseAddress}`);
    } else {
      result(false, 'CaseCreated event not found in receipt');
    }
  } catch (e) {
    result(false, 'factory.fileNewCase()', e.message);
  }

  // ─── Step 10: Verify case state ───────────────────────────────────────────
  if (caseAddress) {
    console.log('\n── Step 10: Verify case state ──');
    const courtCase = new ethers.Contract(caseAddress, CASE_ABI, provider);
    try {
      const state       = await courtCase.state();
      const pltf        = await courtCase.plaintiff();
      const deft        = await courtCase.defendant();
      const claim       = await courtCase.claimDescription();
      const deadline    = await courtCase.deadlineToRespond();
      const pltfStake   = await courtCase.plaintiffStake();

      const stateNum    = Number(state);
      const stateName   = STATES[stateNum] ?? `Unknown(${stateNum})`;
      const isSummoned  = stateNum === 1; // CaseState.Summoned

      result(isSummoned, 'case.state() == Summoned', `state = ${stateNum} (${stateName})`);
      result(pltf.toLowerCase() === deployer.toLowerCase(), 'case.plaintiff() == deployer', pltf);
      result(deft.toLowerCase() === defendant.toLowerCase(), 'case.defendant() == defendant', deft);
      result(pltfStake === ethers.parseEther('0.0002'), 'case.plaintiffStake() == 0.0002 ETH', `${ethers.formatEther(pltfStake)} ETH`);

      const deadlineDate = new Date(Number(deadline) * 1000).toISOString();
      console.log(`${INFO} Respond-by deadline: ${deadlineDate} (5 minutes from filing)`);
      console.log(`${INFO} Claim: "${claim}"`);
    } catch (e) {
      result(false, 'Reading case contract', e.message);
    }

    // ─── Step 11: Verify factory recorded the case ───────────────────────
    console.log('\n── Step 11: Factory case registry ──');
    try {
      const caseCount  = await factory.getCaseCount();
      const allCases   = await factory.getAllCases();
      const caseFound  = allCases.map(a => a.toLowerCase()).includes(caseAddress.toLowerCase());
      result(caseFound, 'factory.getAllCases() includes new case', `Total cases: ${caseCount}`);

      const byPlaintiff = await factory.getCasesByPlaintiff(deployer);
      result(byPlaintiff.map(a => a.toLowerCase()).includes(caseAddress.toLowerCase()),
        'factory.getCasesByPlaintiff(deployer) includes new case', `${byPlaintiff.length} case(s)`);
    } catch (e) {
      result(false, 'factory case registry checks', e.message);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('='.repeat(60));
  console.log('  E2E TEST COMPLETE');
  if (caseAddress) {
    console.log(`  Case address: ${caseAddress}`);
    console.log(`  View on Arbiscan: https://sepolia.arbiscan.io/address/${caseAddress}`);
  }
  console.log('='.repeat(60));
  console.log('');
  console.log('  State machine tested:');
  console.log('    Filed(0) -> Summoned(1)   [via fileNewCase + fileCase]');
  console.log('  Next states (require separate wallets):');
  console.log('    Summoned -> Active(2)     [defendant calls respondToCase]');
  console.log('    Summoned -> Defaulted(6)  [anyone calls missedDeadline after 5 min]');
  console.log('    Active   -> Deliberating(3) [factory assigns 3 judges]');
  console.log('    Deliberating -> Resolved(4) [judges vote]');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nUnhandled error:', err);
    process.exit(1);
  });
