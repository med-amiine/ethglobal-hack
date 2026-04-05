/**
 * verify-arbiscan.js
 * ------------------
 * Verifies all three deployed contracts on Arbiscan (Arbitrum Sepolia)
 * using the Etherscan V2 API + standard-json-input from the Hardhat build-info.
 *
 * Usage:
 *   ARBISCAN_API_KEY=<your_key> node scripts/verify-arbiscan.js
 *
 * Get a free API key at: https://arbiscan.io/myapikey  (free account)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ---- Config ----
const CHAIN_ID = '421614'; // Arbitrum Sepolia
const API_URL = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}`;
const COMPILER_VERSION = 'v0.8.23+commit.f704f362';
const OPTIMIZER_RUNS = 200;

const CONTRACTS = [
  {
    name: 'JRXToken',
    address: '0x3df62D6BD41DA6a756bB83cC7267F9F2883e28aF',
    source: 'contracts/JRXToken.sol',
    constructorArgs: '', // no constructor args
  },
  {
    name: 'CourtRegistry',
    address: '0x6929B88cAaEC8adee9715De61db4006846bBaBbe',
    source: 'contracts/CourtRegistry.sol',
    constructorArgs: '', // no constructor args
  },
  {
    name: 'CourtCaseFactoryTest',
    address: '0xfCD7A25A6E5EcA5Ff95e861adDdFC23fF08Da6Cc',
    source: 'contracts/CourtCaseFactoryTest.sol',
    // ABI-encoded constructor arg: address (CourtRegistry)
    constructorArgs: '0000000000000000000000006929B88cAaEC8adee9715De61db4006846bBaBbe',
  },
  {
    name: 'AgentCourtHook',
    address: '0x124264777042c85A389d28F378AEb184DB22a02B',
    source: 'contracts/AgentCourtHook.sol',
    // ABI-encoded constructor args: address registry, address acpContract (deployer placeholder)
    constructorArgs: '0000000000000000000000006929B88cAaEC8adee9715De61db4006846bBaBbe000000000000000000000000D8CDe62aCB881329EBb4694f37314b7bBA77EbDe',
  },
];

// ---- Load standard-json input from build-info ----
function loadStandardJsonInput() {
  const buildInfoDir = path.join(__dirname, '..', 'artifacts', 'build-info');
  const files = fs.readdirSync(buildInfoDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) throw new Error('No build-info found. Run: npx hardhat compile');

  // Use the most recent build-info
  const latest = files
    .map(f => ({ f, mt: fs.statSync(path.join(buildInfoDir, f)).mtimeMs }))
    .sort((a, b) => b.mt - a.mt)[0].f;

  const buildInfo = JSON.parse(fs.readFileSync(path.join(buildInfoDir, latest), 'utf8'));
  return JSON.stringify(buildInfo.input);
}

// ---- HTTP POST helper ----
function post(url, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---- Check verification status ----
async function checkStatus(apiKey, guid) {
  const params = {
    module: 'contract',
    action: 'checkverifystatus',
    guid,
    apikey: apiKey,
  };
  return post(API_URL, params);
}

// ---- Wait for result ----
async function waitForVerification(apiKey, guid, contractName) {
  const MAX_ATTEMPTS = 20;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const result = await checkStatus(apiKey, guid);
    const status = result.result || '';
    process.stdout.write(`\r  [${i + 1}/${MAX_ATTEMPTS}] ${contractName}: ${status}                    `);
    if (status === 'Pass - Verified' || status === 'Already Verified') {
      console.log();
      return true;
    }
    if (status.startsWith('Fail')) {
      console.log();
      console.error(`  FAILED: ${status}`);
      return false;
    }
  }
  console.log('\n  Timed out waiting for verification');
  return false;
}

// ---- Main ----
async function main() {
  const apiKey = process.env.ARBISCAN_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER') {
    console.error(`
ERROR: No Arbiscan API key found.

1. Go to https://arbiscan.io/myapikey and create a free account
2. Generate a free API key
3. Run:  ARBISCAN_API_KEY=<your_key> node scripts/verify-arbiscan.js
`);
    process.exit(1);
  }

  console.log('Loading standard-json-input from build artifacts...');
  const sourceCode = loadStandardJsonInput();
  console.log(`  Input size: ${(sourceCode.length / 1024).toFixed(1)} KB\n`);

  for (const contract of CONTRACTS) {
    console.log(`Submitting ${contract.name} (${contract.address})...`);

    const params = {
      module: 'contract',
      action: 'verifysourcecode',
      apikey: apiKey,
      contractaddress: contract.address,
      sourceCode,
      codeformat: 'solidity-standard-json-input',
      contractname: `${contract.source}:${contract.name}`,
      compilerversion: COMPILER_VERSION,
      optimizationUsed: '1',
      runs: String(OPTIMIZER_RUNS),
      constructorArguements: contract.constructorArgs,
      licenseType: '3', // MIT
    };

    const response = await post(API_URL, params);

    if (response.status === '1') {
      const guid = response.result;
      console.log(`  Submitted. GUID: ${guid}`);
      const ok = await waitForVerification(apiKey, guid, contract.name);
      if (ok) {
        console.log(`  ✓ Verified: https://sepolia.arbiscan.io/address/${contract.address}#code`);
      }
    } else {
      const msg = response.result || JSON.stringify(response);
      if (msg.includes('already verified') || msg.includes('Already Verified')) {
        console.log(`  Already verified: https://sepolia.arbiscan.io/address/${contract.address}#code`);
      } else {
        console.error(`  ERROR: ${msg}`);
      }
    }
    console.log();
    // Rate limit buffer between submissions
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error);
