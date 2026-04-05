import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { parseUnits } from "viem";
import { getPublicClient, getWalletClient } from "../client.js";
import { CONTRACTS, REGISTRY_ABI, JRX_ABI } from "../config.js";
import { header, success, warn, txLink, formatJrx } from "../ui.js";

export function stakeCommand(program: Command) {
  const cmd = program.command("stake").description("Manage JRX judge staking");

  // jurex stake
  cmd
    .command("add [amount]")
    .description("Stake JRX to join the judge pool (min 1,000 JRX)")
    .action(async (amountArg?: string) => {
      header("Stake JRX — Join Judge Pool");

      const { client: wallet, account } = getWalletClient();
      const client = getPublicClient();

      const spinner = ora("Checking balances...").start();
      let jrxBalance: bigint;
      let currentStake: bigint;
      let minStake: bigint;
      try {
        [jrxBalance, currentStake, minStake] = await Promise.all([
          client.readContract({ address: CONTRACTS.JRXToken, abi: JRX_ABI, functionName: "balanceOf", args: [account.address] }),
          client.readContract({ address: CONTRACTS.CourtRegistry, abi: REGISTRY_ABI, functionName: "judgeStakes", args: [account.address] }),
          client.readContract({ address: CONTRACTS.CourtRegistry, abi: REGISTRY_ABI, functionName: "JUDGE_STAKE_MIN" }),
        ]);
        spinner.stop();
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
        return;
      }

      console.log(`  JRX balance:   ${formatJrx(jrxBalance)}`);
      console.log(`  Current stake: ${formatJrx(currentStake)}`);
      console.log(`  Min required:  ${formatJrx(minStake)}`);

      if (jrxBalance === 0n) {
        warn("No JRX balance. Run `jurex faucet` to get 10,000 JRX.");
        return;
      }

      let amount: bigint;
      if (amountArg) {
        amount = parseUnits(amountArg, 18);
      } else {
        const { amtStr } = await inquirer.prompt([
          {
            type: "input",
            name: "amtStr",
            message: `Amount to stake (min ${Number(minStake) / 1e18} JRX):`,
            default: String(Number(minStake) / 1e18),
            validate: (v: string) => {
              const n = parseFloat(v);
              return (!isNaN(n) && n > 0) || "Enter a positive number";
            },
          },
        ]);
        amount = parseUnits(amtStr, 18);
      }

      if (amount < minStake && currentStake === 0n) {
        warn(`Minimum stake is ${formatJrx(minStake)}.`);
        process.exit(1);
      }

      const { confirm } = await inquirer.prompt([
        { type: "confirm", name: "confirm", message: `Stake ${formatJrx(amount)}?`, default: true },
      ]);
      if (!confirm) return;

      // Approve
      const spin2 = ora("Approving JRX...").start();
      try {
        const approveTx = await wallet.writeContract({
          address: CONTRACTS.JRXToken,
          abi: JRX_ABI,
          functionName: "approve",
          args: [CONTRACTS.CourtRegistry, amount],
        });
        await client.waitForTransactionReceipt({ hash: approveTx });
        spin2.text = "Staking...";

        const stakeTx = await wallet.writeContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "stakeAsJudge",
          args: [amount],
        });
        await client.waitForTransactionReceipt({ hash: stakeTx });
        spin2.stop();

        success(`Staked ${formatJrx(amount)}!`);
        console.log(`  Transaction: ${txLink(stakeTx)}`);
        console.log(chalk.gray("\n  You are now in the judge pool and eligible for case assignment."));
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
      }
    });

  // jurex stake remove
  cmd
    .command("remove")
    .description("Unstake all JRX and leave the judge pool")
    .action(async () => {
      header("Unstake JRX");

      const { client: wallet, account } = getWalletClient();
      const client = getPublicClient();

      const spinner = ora("Checking stake...").start();
      let currentStake: bigint;
      try {
        currentStake = await client.readContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "judgeStakes",
          args: [account.address],
        });
        spinner.stop();
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
        return;
      }

      if (currentStake === 0n) {
        warn("No active stake found.");
        return;
      }

      console.log(`  Current stake: ${formatJrx(currentStake)}`);
      const { confirm } = await inquirer.prompt([
        { type: "confirm", name: "confirm", message: "Unstake all and leave the pool?", default: false },
      ]);
      if (!confirm) return;

      const spin2 = ora("Unstaking...").start();
      try {
        const hash = await wallet.writeContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "unstakeJudge",
        });
        await client.waitForTransactionReceipt({ hash });
        spin2.stop();

        success(`Unstaked ${formatJrx(currentStake)}.`);
        console.log(`  Transaction: ${txLink(hash)}`);
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
      }
    });
}
