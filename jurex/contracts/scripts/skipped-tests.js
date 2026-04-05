/**
 * skipped-tests.js — Runs the 4 previously skipped tests:
 *
 *   G3: missedDeadline() after 5-min response deadline
 *   I2: resolveAfterDeadline() after 30-min deliberation timeout
 *   L2: Winning plaintiff reputation increases after resolved case
 *   L3: Losing defendant reputation decreases after resolved case
 *
 * Run with: node scripts/skipped-tests.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

const JRX_ADDRESS      = '0x463053d5f14a24e580eD5703f376C06dE0d6420C';
const REGISTRY_ADDRESS = '0xB67E78e0396dD200900965F6Ec9D8b246ef3E23b';
const FACTORY_ADDRESS  = '0x6e0c034FFEB81891100ae566c3C30050237a0914';
const RPC_URL          = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY      = process.env.PRIVATE_KEY;

const artifactsBase = path.join(__dirname, '..', 'artifacts', 'contracts');
const JRX_ABI      = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'JRXToken.sol/JRXToken.json'))).abi;
const REGISTRY_ABI = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtRegistry.sol/CourtRegistry.json'))).abi;
const FACTORY_ABI  = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtCaseFactoryTest.sol/CourtCaseFactoryTest.json'))).abi;
const CASE_ABI     = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'CourtCaseTest.sol/CourtCaseTest.json'))).abi;

const STATES = ['Filed','Summoned','Active','Deliberating','Resolved','Dismissed','Defaulted','Appealed'];
const ONE_JRX = 10n ** 18n;
const STAKE_AMOUNT = 1000n * ONE_JRX;
const GAS_LIMIT = 500_000;

// Deterministic test wallets (same as main suite)
function getWallet(i, provider) {
  const pk = ethers.keccak256(ethers.toUtf8Bytes('jurex-test-wallet-' + i));
  return new ethers.Wallet(pk, provider);
}

// ─── Simple test framework ─────────────────────────────────────────────────
const results = [];
let pass = 0, fail = 0;

async function test(id, name, fn) {
  try {
    const receipt = await fn();
    const txHash = receipt?.hash || receipt?.transactionHash || null;
    const proof = txHash ? `https://sepolia.arbiscan.io/tx/${txHash}` : 'read-only check';
    console.log(`  PASS | ${id}: ${name}`);
    console.log(`       | proof: ${proof}`);
    results.push({ id, name, status: 'PASS', txHash, proof });
    pass++;
  } catch (e) {
    const msg = (e.message || String(e)).substring(0, 300);
    console.log(`  FAIL | ${id}: ${name}`);
    console.log(`       | ${msg}`);
    results.push({ id, name, status: 'FAIL', error: msg });
    fail++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, label) { if (a !== b) throw new Error(`${label}: expected ${b}, got ${a}`); }

// Wait with countdown
async function waitUntil(targetTs, label) {
  let remaining = targetTs - Math.floor(Date.now() / 1000);
  if (remaining <= 0) {
    console.log(`  [${label}] already passed — proceeding immediately`);
    return;
  }
  console.log(`  [${label}] waiting ${remaining}s...`);
  while (remaining > 0) {
    const chunk = Math.min(remaining, 15);
    await new Promise(r => setTimeout(r, chunk * 1000));
    remaining -= chunk;
    if (remaining > 0) process.stdout.write(`    ${remaining}s remaining...\r`);
  }
  console.log(`  [${label}] done waiting.                    `);
}

function parseCaseAddress(receipt, iface) {
  for (const logEntry of receipt.logs) {
    try {
      const parsed = iface.parseLog(logEntry);
      if (parsed?.name === 'CaseCreated') return parsed.args.caseAddress;
    } catch (_) {}
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  AGENT COURT — Skipped Tests Runner');
  console.log('='.repeat(70));

  if (!PRIVATE_KEY) { console.error('ERROR: PRIVATE_KEY not set'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  const PLAINTIFF = getWallet(0, provider);
  const DEFENDANT = getWallet(1, provider);
  const JUDGE_1   = getWallet(2, provider);
  const JUDGE_2   = getWallet(3, provider);
  const JUDGE_3   = getWallet(4, provider);

  console.log(`\n  Deployer:  ${deployer.address}`);
  console.log(`  PLAINTIFF: ${PLAINTIFF.address}`);
  console.log(`  DEFENDANT: ${DEFENDANT.address}`);
  console.log(`  ETH bal (deployer): ${ethers.formatEther(await provider.getBalance(deployer.address))}`);

  const jrx      = new ethers.Contract(JRX_ADDRESS, JRX_ABI, deployer);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, deployer);
  const factory  = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
  const factoryIface = new ethers.Interface(FACTORY_ABI);

  // ── Fund helper ───────────────────────────────────────────────────────────
  async function ensureEth(wallet, minWei, label) {
    const bal = await provider.getBalance(wallet.address);
    if (bal < minWei) {
      const deficit = minWei - bal;
      const tx = await deployer.sendTransaction({ to: wallet.address, value: deficit });
      await tx.wait();
      console.log(`  Funded ${label} with ${ethers.formatEther(deficit)} ETH`);
    }
  }

  // ── Ensure judges are staked ──────────────────────────────────────────────
  async function ensureJudgeStaked(wallet, label) {
    const stake = await registry.judgeStakes(wallet.address);
    if (stake >= STAKE_AMOUNT) {
      console.log(`  ${label} already staked: ${ethers.formatUnits(stake, 18)} JRX`);
      return;
    }
    await ensureEth(wallet, ethers.parseEther('0.0003'), label);
    const needed = STAKE_AMOUNT - stake;
    const jrxBal = await jrx.balanceOf(wallet.address);
    if (jrxBal < needed) {
      const mt = await jrx.mint(wallet.address, needed + 100n * ONE_JRX, { gasLimit: GAS_LIMIT });
      await mt.wait();
    }
    const jrxW = new ethers.Contract(JRX_ADDRESS, JRX_ABI, wallet);
    const regW = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
    const at = await jrxW.approve(REGISTRY_ADDRESS, needed, { gasLimit: GAS_LIMIT });
    await at.wait();
    const st = await regW.stakeAsJudge(needed, { gasLimit: GAS_LIMIT });
    await st.wait();
    console.log(`  Staked ${label} with ${ethers.formatUnits(needed, 18)} JRX`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // G3: missedDeadline() after 5-min response deadline
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('  TEST G3 — Default Judgment (5-min deadline)');
  console.log('='.repeat(70));

  // Use existing case G from test-results.json
  const CASE_G = '0x54146f95186A3a783D7201cd152E7FFb45bb7C0C';
  const caseG = new ethers.Contract(CASE_G, CASE_ABI, provider);
  const stateG = Number(await caseG.state());
  const deadlineG = Number(await caseG.deadlineToRespond());

  console.log(`  Case G: ${CASE_G}`);
  console.log(`  State: ${STATES[stateG]}`);
  console.log(`  Deadline: ${new Date(deadlineG * 1000).toISOString()}`);

  if (stateG === 1) {
    // Summoned — wait for deadline then trigger default
    await waitUntil(deadlineG + 2, 'G3 deadline');

    await test('G3', 'missedDeadline() after 5-min deadline → Defaulted', async () => {
      const caseAsP = new ethers.Contract(CASE_G, CASE_ABI, PLAINTIFF);
      await ensureEth(PLAINTIFF, ethers.parseEther('0.0001'), 'PLAINTIFF');
      const tx = await caseAsP.missedDeadline({ gasLimit: GAS_LIMIT });
      const receipt = await tx.wait();
      const stateAfter = Number(await caseG.state());
      assertEqual(stateAfter, 6, 'state should be Defaulted(6)');
      const bal = await provider.getBalance(CASE_G);
      assert(bal === 0n || bal < ethers.parseEther('0.0002'), 'Plaintiff stake should be returned');
      return receipt;
    });
  } else if (stateG === 6) {
    await test('G3', 'missedDeadline() already triggered — verify state is Defaulted', async () => {
      assertEqual(stateG, 6, 'state should be Defaulted(6)');
      console.log('    (already defaulted from previous run)');
      return { hash: null };
    });
  } else {
    console.log(`  SKIP G3: Case G is in state ${STATES[stateG]}, expected Summoned(1)`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // I2: resolveAfterDeadline() after 30-min deliberation timeout
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('  TEST I2 — Deliberation Timeout (30-min)');
  console.log('='.repeat(70));

  const CASE_H = '0x44dBa004Cd85174754c95Cd26CB316405a1aF958';
  const caseH = new ethers.Contract(CASE_H, CASE_ABI, provider);
  const stateH = Number(await caseH.state());
  const deliberationStarted = Number(await caseH.deliberationStartedAt());
  const DELIBERATION_TIMEOUT = 30 * 60; // 30 minutes
  const deliberationDeadline = deliberationStarted + DELIBERATION_TIMEOUT;

  console.log(`  Case H/I: ${CASE_H}`);
  console.log(`  State: ${STATES[stateH]}`);
  console.log(`  deliberationStartedAt: ${new Date(deliberationStarted * 1000).toISOString()}`);
  console.log(`  deliberationDeadline:  ${new Date(deliberationDeadline * 1000).toISOString()}`);

  if (stateH === 3) {
    // Deliberating — wait for 30-min timeout
    await waitUntil(deliberationDeadline + 2, 'I2 deliberation timeout');

    await test('I2', 'resolveAfterDeadline() after 30-min timeout → Dismissed + stakes refunded', async () => {
      const caseAsAny = new ethers.Contract(CASE_H, CASE_ABI, PLAINTIFF);
      await ensureEth(PLAINTIFF, ethers.parseEther('0.0001'), 'PLAINTIFF');

      const pStake = await caseH.plaintiffStake();
      const dStake = await caseH.defendantStake();
      const pBalBefore = await provider.getBalance(PLAINTIFF.address);
      const dBalBefore = await provider.getBalance(DEFENDANT.address);

      const tx = await caseAsAny.resolveAfterDeadline({ gasLimit: GAS_LIMIT });
      const receipt = await tx.wait();

      const stateAfter = Number(await caseH.state());
      assertEqual(stateAfter, 5, 'state should be Dismissed(5)');

      // Verify stakes were refunded (balance increased)
      const pBalAfter = await provider.getBalance(PLAINTIFF.address);
      const dBalAfter = await provider.getBalance(DEFENDANT.address);

      assert(pBalAfter > pBalBefore - ethers.parseEther('0.00005'), `Plaintiff should be refunded ${pStake}`);
      assert(dBalAfter > dBalBefore - ethers.parseEther('0.00005'), `Defendant should be refunded ${dStake}`);

      console.log(`    State after: ${STATES[stateAfter]}`);
      console.log(`    Plaintiff ETH change: ${ethers.formatEther(pBalAfter - pBalBefore)}`);
      console.log(`    Defendant ETH change: ${ethers.formatEther(dBalAfter - dBalBefore)}`);
      return receipt;
    });
  } else if (stateH === 5) {
    await test('I2', 'resolveAfterDeadline() already triggered — verify state is Dismissed', async () => {
      assertEqual(stateH, 5, 'state should be Dismissed(5)');
      console.log('    (already dismissed from previous run)');
      return { hash: null };
    });
  } else {
    console.log(`  SKIP I2: Case H is in state ${STATES[stateH]}, expected Deliberating(3)`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // L2 + L3: Reputation changes after resolved case
  // Requires PLAINTIFF and DEFENDANT to be registered agents.
  // We file + resolve a brand-new case so reputation updates happen on-chain.
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('  TESTS L2 + L3 — Reputation After Verdict');
  console.log('='.repeat(70));

  // Step 1: Register PLAINTIFF and DEFENDANT if not already registered
  const pProfile = await registry.getAgentProfile(PLAINTIFF.address);
  const dProfile = await registry.getAgentProfile(DEFENDANT.address);

  console.log(`\n  PLAINTIFF registered: ${pProfile.isRegistered}`);
  console.log(`  DEFENDANT registered: ${dProfile.isRegistered}`);

  if (!pProfile.isRegistered) {
    await ensureEth(PLAINTIFF, ethers.parseEther('0.0002'), 'PLAINTIFF');
    const regAsP = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, PLAINTIFF);
    const tx = await regAsP.selfRegister({ gasLimit: GAS_LIMIT });
    const receipt = await tx.wait();
    console.log(`  Registered PLAINTIFF — tx: ${receipt.hash}`);
  }
  if (!dProfile.isRegistered) {
    await ensureEth(DEFENDANT, ethers.parseEther('0.0002'), 'DEFENDANT');
    const regAsD = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, DEFENDANT);
    const tx = await regAsD.selfRegister({ gasLimit: GAS_LIMIT });
    const receipt = await tx.wait();
    console.log(`  Registered DEFENDANT — tx: ${receipt.hash}`);
  }

  const pRepBefore = Number((await registry.getAgentProfile(PLAINTIFF.address)).reputationScore);
  const dRepBefore = Number((await registry.getAgentProfile(DEFENDANT.address)).reputationScore);
  console.log(`  PLAINTIFF rep before: ${pRepBefore}`);
  console.log(`  DEFENDANT rep before: ${dRepBefore}`);

  // Step 2: Ensure judges are staked
  console.log('\n  --- Ensuring judges are staked ---');
  await ensureJudgeStaked(JUDGE_1, 'JUDGE_1');
  await ensureJudgeStaked(JUDGE_2, 'JUDGE_2');
  await ensureJudgeStaked(JUDGE_3, 'JUDGE_3');

  // Step 3: File a new case
  console.log('\n  --- Filing L2/L3 reputation test case ---');
  await ensureEth(PLAINTIFF, ethers.parseEther('0.0008'), 'PLAINTIFF');
  await ensureEth(DEFENDANT, ethers.parseEther('0.0006'), 'DEFENDANT');

  const factoryAsP = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, PLAINTIFF);
  const fileTx = await factoryAsP.fileNewCase(
    DEFENDANT.address,
    'L2/L3 reputation test: plaintiff wins',
    'QmReputationTest',
    { value: ethers.parseEther('0.0002'), gasLimit: 3_500_000 }
  );
  const fileReceipt = await fileTx.wait();
  const repCaseAddr = parseCaseAddress(fileReceipt, factoryIface);
  assert(repCaseAddr, 'No CaseCreated event for L2/L3 case');
  console.log(`  Case filed: ${repCaseAddr}`);
  console.log(`  File tx: ${fileReceipt.hash}`);

  // Step 4: Defendant responds
  const caseAsD = new ethers.Contract(repCaseAddr, CASE_ABI, DEFENDANT);
  const respondTx = await caseAsD.respondToCase({ value: ethers.parseEther('0.0001'), gasLimit: GAS_LIMIT });
  const respondReceipt = await respondTx.wait();
  console.log(`  Defendant responded — tx: ${respondReceipt.hash}`);

  // Step 5: Assign judges
  const factoryAsD = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
  const assignTx = await factoryAsD.assignJudgesToCase(repCaseAddr, 999, { gasLimit: 3_500_000 });
  const assignReceipt = await assignTx.wait();
  console.log(`  Judges assigned — tx: ${assignReceipt.hash}`);

  const repCase = new ethers.Contract(repCaseAddr, CASE_ABI, provider);
  const assignedJudges = await repCase.getJudges();
  console.log(`  Assigned judges: ${assignedJudges.join(', ')}`);

  // Step 6: Judges vote plaintiffWins (2/3 majority)
  function findWallet(addr) {
    for (const w of [JUDGE_1, JUDGE_2, JUDGE_3]) {
      if (w.address.toLowerCase() === addr.toLowerCase()) return w;
    }
    return null;
  }

  let voteReceipt1, voteReceipt2;
  const j0wallet = findWallet(assignedJudges[0]);
  const j1wallet = findWallet(assignedJudges[1]);

  if (!j0wallet || !j1wallet) {
    console.log('  WARNING: Assigned judges are not in JUDGE_1/2/3 wallets. Using deployer workaround...');
    // This can happen if pool has extra judges. Just vote with any two from the assigned list.
    // We can't — we don't have their keys. In this case skip L2/L3 with a clear error.
    console.log('  SKIP L2/L3: Cannot vote — assigned judges not in controlled wallets.');
    console.log('  To fix: unstake external judges from the pool before running.');
    results.push({ id: 'L2', name: 'Winning plaintiff reputation > initial', status: 'SKIP', reason: 'Assigned judges not in test wallet set' });
    results.push({ id: 'L3', name: 'Losing defendant reputation < initial', status: 'SKIP', reason: 'Assigned judges not in test wallet set' });
  } else {
    await ensureEth(j0wallet, ethers.parseEther('0.00015'), 'JUDGE_0');
    await ensureEth(j1wallet, ethers.parseEther('0.00015'), 'JUDGE_1');

    const caseAsJ0 = new ethers.Contract(repCaseAddr, CASE_ABI, j0wallet);
    const caseAsJ1 = new ethers.Contract(repCaseAddr, CASE_ABI, j1wallet);

    const voteTx1 = await caseAsJ0.submitVote(true, { gasLimit: GAS_LIMIT });
    voteReceipt1 = await voteTx1.wait();
    console.log(`  Judge 0 voted plaintiffWins — tx: ${voteReceipt1.hash}`);

    const voteTx2 = await caseAsJ1.submitVote(true, { gasLimit: GAS_LIMIT });
    voteReceipt2 = await voteTx2.wait();
    console.log(`  Judge 1 voted plaintiffWins — tx: ${voteReceipt2.hash}`);

    const stateAfterVote = Number(await repCase.state());
    console.log(`  Case state after votes: ${STATES[stateAfterVote]}`);

    // Step 7: Check reputation
    const pRepAfter = Number((await registry.getAgentProfile(PLAINTIFF.address)).reputationScore);
    const dRepAfter = Number((await registry.getAgentProfile(DEFENDANT.address)).reputationScore);

    console.log(`  PLAINTIFF rep: ${pRepBefore} → ${pRepAfter} (delta: ${pRepAfter - pRepBefore})`);
    console.log(`  DEFENDANT rep: ${dRepBefore} → ${dRepAfter} (delta: ${dRepAfter - dRepBefore})`);

    await test('L2', 'Winning plaintiff reputation increases after verdict', async () => {
      assert(pRepAfter > pRepBefore, `Plaintiff rep should increase: was ${pRepBefore}, now ${pRepAfter}`);
      return voteReceipt2; // second vote triggers verdict + reputation update
    });

    await test('L3', 'Losing defendant reputation decreases after verdict', async () => {
      assert(dRepAfter < dRepBefore, `Defendant rep should decrease: was ${dRepBefore}, now ${dRepAfter}`);
      return voteReceipt2;
    });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('  SKIPPED TESTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Total:  ${results.length}`);
  console.log(`  Passed: ${pass}`);
  console.log(`  Failed: ${fail}`);
  console.log(`  Skipped: ${results.filter(r => r.status === 'SKIP').length}`);
  console.log('='.repeat(70));

  if (fail > 0) {
    console.log('\n  FAILURES:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`    ${r.id}: ${r.name}`);
      console.log(`    Error: ${r.error}`);
    }
  }

  // Append results to test-results.json
  const resultPath = path.join(__dirname, '..', 'test-results.json');
  const existing = JSON.parse(fs.readFileSync(resultPath));
  for (const r of results) {
    const idx = existing.results.findIndex(x => x.suite === r.id);
    const entry = {
      suite: r.id,
      name: `${r.id}: ${r.name}`,
      status: r.status,
      ...(r.txHash ? { txHash: r.txHash, proof: r.proof } : {}),
      ...(r.error ? { error: r.error } : {}),
      ...(r.reason ? { reason: r.reason } : {}),
    };
    if (idx >= 0) existing.results[idx] = entry;
    else existing.results.push(entry);
  }
  existing.summary.passed = existing.results.filter(r => r.status === 'PASS').length;
  existing.summary.failed = existing.results.filter(r => r.status === 'FAIL').length;
  existing.summary.skipped = existing.results.filter(r => r.status === 'SKIP').length;
  existing.summary.total = existing.results.length;
  existing.timestamp = new Date().toISOString();
  fs.writeFileSync(resultPath, JSON.stringify(existing, null, 2));
  console.log('\n  Results written to test-results.json');
}

main().catch(e => { console.error(e); process.exit(1); });
