import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { getPublicClient, getWalletClient } from "../client.js";
import { CONTRACTS, JRX_ABI } from "../config.js";
import { header, success, warn, txLink, formatJrx } from "../ui.js";

export function faucetCommand(program: Command) {
  program
    .command("faucet")
    .description("Drip 10,000 JRX from the faucet (once per 24h)")
    .action(async () => {
      header("JRX Faucet");

      const { client: wallet, account } = getWalletClient();
      const client = getPublicClient();

      const spinner = ora("Checking cooldown...").start();
      try {
        const [lastDrip, cooldown, faucetAmount, balance] = await Promise.all([
          client.readContract({ address: CONTRACTS.JRXToken, abi: JRX_ABI, functionName: "lastDripAt", args: [account.address] }),
          client.readContract({ address: CONTRACTS.JRXToken, abi: JRX_ABI, functionName: "FAUCET_COOLDOWN" }),
          client.readContract({ address: CONTRACTS.JRXToken, abi: JRX_ABI, functionName: "FAUCET_AMOUNT" }),
          client.readContract({ address: CONTRACTS.JRXToken, abi: JRX_ABI, functionName: "balanceOf", args: [account.address] }),
        ]);
        spinner.stop();

        console.log(`  Current balance: ${formatJrx(balance)}`);
        console.log(`  Faucet amount:   ${formatJrx(faucetAmount)}`);

        // Check if cooldown has passed
        const now = BigInt(Math.floor(Date.now() / 1000));
        const nextDrip = lastDrip + cooldown;

        if (lastDrip > 0n && now < nextDrip) {
          const remaining = Number(nextDrip - now);
          const hours = Math.floor(remaining / 3600);
          const mins = Math.floor((remaining % 3600) / 60);
          warn(`Cooldown active — ${hours}h ${mins}m until next drip.`);
          return;
        }

        const spin2 = ora("Dripping 10,000 JRX...").start();
        const hash = await wallet.writeContract({
          address: CONTRACTS.JRXToken,
          abi: JRX_ABI,
          functionName: "drip",
          args: [account.address],
        });
        spin2.text = "Waiting for confirmation...";
        await client.waitForTransactionReceipt({ hash });
        spin2.stop();

        success(`Received ${formatJrx(faucetAmount)}!`);
        console.log(`  Transaction: ${txLink(hash)}`);
        console.log(chalk.gray("\n  Run `jurex stake add` to stake as a judge."));
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });
}
