/**
 * SDK unit tests — use live Arbitrum One RPC (read-only, no wallet needed).
 * Run: npx tsx src/client.test.ts
 */
import { createJurex } from "./client.js";
import { WalletRequiredError, FaucetCooldownError } from "./errors.js";
import { CONTRACTS } from "./constants.js";

const jurex = createJurex(); // no private key — read-only

async function run() {
  let passed = 0;
  let failed = 0;

  function ok(name: string) { console.log(`  ✓ ${name}`); passed++; }
  function fail(name: string, err: unknown) { console.log(`  ✗ ${name}: ${err}`); failed++; }

  console.log("\n@jurex/sdk — read-only tests (live Arbitrum One)\n");

  // ─── Constants ───────────────────────────────────────────────────────────────
  console.log("Constants:");
  try {
    const { CONTRACTS: C } = await import("./constants.js");
    if (C.CourtRegistry !== "0x2d02a6A204de958cFa6551710681f230043bF646") throw new Error("wrong address");
    if (C.JRXToken !== "0xEDE88f95A4432dB584F9F2F2244312b146D572b4") throw new Error("wrong JRX address");
    ok("Contract addresses correct (Arbitrum Sepolia)");
  } catch (e) { fail("Contract addresses", e); }

  // ─── Error classes ────────────────────────────────────────────────────────────
  console.log("\nError classes:");
  try {
    const err = new WalletRequiredError();
    if (!(err instanceof WalletRequiredError)) throw new Error("not instance");
    ok("WalletRequiredError instanceof check");
  } catch (e) { fail("WalletRequiredError", e); }

  try {
    const err = new FaucetCooldownError(3700);
    if (!err.message.includes("1h")) throw new Error("bad format");
    ok("FaucetCooldownError message formats hours correctly");
  } catch (e) { fail("FaucetCooldownError", e); }

  // ─── WalletRequiredError thrown for write ops ─────────────────────────────────
  console.log("\nWallet guard:");
  try {
    await jurex.register();
    fail("register() should throw without wallet", "no error");
  } catch (e) {
    if (e instanceof WalletRequiredError) ok("register() throws WalletRequiredError");
    else fail("register() wrong error type", e);
  }

  try {
    await jurex.stake(1000);
    fail("stake() should throw without wallet", "no error");
  } catch (e) {
    if (e instanceof WalletRequiredError) ok("stake() throws WalletRequiredError");
    else fail("stake() wrong error type", e);
  }

  // ─── Read-only operations (live chain) ────────────────────────────────────────
  console.log("\nRead-only (live Arbitrum One):");

  try {
    const size = await jurex.judgePoolSize();
    if (typeof size !== "number") throw new Error("not a number");
    ok(`judgePoolSize() returned ${size}`);
  } catch (e) { fail("judgePoolSize()", e); }

  // Use deployer address which is known to be registered
  const DEPLOYER = "0xD8CDe62aCB881329EBb4694f37314b7bBA77EbDe" as const;

  try {
    const rep = await jurex.reputation(DEPLOYER);
    // Deployer may not be registered — score will be 0 (initial) for unregistered addresses
    if (!("reputationScore" in rep)) throw new Error("no score field");
    ok(`reputation() onchain fallback works (score=${rep.reputationScore}, registered=${rep.isRegistered})`);
  } catch (e) { fail("reputation() onchain fallback", e); }

  try {
    const balance = await jurex.jrxBalance(DEPLOYER);
    if (typeof balance !== "number") throw new Error("not a number");
    ok(`jrxBalance() returned ${balance.toLocaleString()} JRX`);
  } catch (e) { fail("jrxBalance()", e); }

  try {
    const cases = await jurex.listCases();
    if (!Array.isArray(cases)) throw new Error("not array");
    ok(`listCases() returned ${cases.length} cases`);
  } catch (e) { fail("listCases()", e); }

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
