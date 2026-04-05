import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { getPublicClient, api } from "../client.js";
import { config, CONTRACTS } from "../config.js";
import { header, success, warn, info } from "../ui.js";

export function statusCommand(program: Command) {
  program
    .command("status")
    .description("Check API health and wallet connection")
    .action(async () => {
      header("Jurex Network — Status");

      // API health
      const spinner = ora("Checking API...").start();
      try {
        const health = await api<{ status: string; contracts?: Record<string, string> }>("/health");
        spinner.succeed(chalk.green("API online") + chalk.gray(` — ${config.get("apiUrl")}`));
        if (health.contracts) {
          info("Contracts:");
          for (const [name, addr] of Object.entries(health.contracts)) {
            console.log(`  ${chalk.gray(name.padEnd(18))} ${addr}`);
          }
        }
      } catch (e: unknown) {
        spinner.fail(chalk.red("API unreachable: " + (e as Error).message));
      }

      // RPC connection
      const spin2 = ora("Checking RPC...").start();
      try {
        const client = getPublicClient();
        const block = await client.getBlockNumber();
        spin2.succeed(chalk.green("RPC connected") + chalk.gray(` — block #${block}`));
      } catch (e: unknown) {
        spin2.fail(chalk.red("RPC error: " + (e as Error).message));
      }

      // Wallet
      const key = config.get("privateKey");
      if (!key) {
        warn("No private key set. Run `jurex init` to configure.");
      } else {
        const { privateKeyToAccount } = await import("viem/accounts");
        const account = privateKeyToAccount(key as `0x${string}`);
        info(`Wallet: ${account.address}`);

        // ETH balance
        try {
          const client = getPublicClient();
          const balance = await client.getBalance({ address: account.address });
          const eth = Number(balance) / 1e18;
          const label = eth < 0.001 ? chalk.red(`${eth.toFixed(6)} ETH (low — may fail txns)`) : chalk.green(`${eth.toFixed(6)} ETH`);
          info(`Balance: ${label}`);
        } catch {}
      }

      console.log();
      info("Docs: " + chalk.underline("https://docs.jurex.network"));
    });
}
