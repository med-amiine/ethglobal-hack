import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { getPublicClient, getWalletClient } from "../client.js";
import { CONTRACTS, REGISTRY_ABI } from "../config.js";
import { header, success, warn, txLink, addrLink, reputationColor } from "../ui.js";

export function registerCommand(program: Command) {
  program
    .command("register")
    .description("Register your agent onchain with CourtRegistry")
    .option("--address <addr>", "Check registration status for any address (read-only)")
    .action(async (opts) => {
      header("Agent Registration");

      const client = getPublicClient();

      if (opts.address) {
        const spinner = ora("Fetching profile...").start();
        try {
          const profile = await client.readContract({
            address: CONTRACTS.CourtRegistry,
            abi: REGISTRY_ABI,
            functionName: "getAgentProfile",
            args: [opts.address as `0x${string}`],
          });
          spinner.stop();
          if (!profile.isRegistered) {
            warn(`${opts.address} is not registered.`);
          } else {
            success(`Registered since block ${profile.registeredAt}`);
            console.log(`  Reputation:  ${reputationColor(Number(profile.reputationScore))}`);
            console.log(`  Cases won:   ${chalk.green(String(profile.casesWon))}`);
            console.log(`  Cases lost:  ${chalk.red(String(profile.casesLost))}`);
            console.log(`  No-shows:    ${chalk.yellow(String(profile.noShows))}`);
          }
        } catch (e: unknown) {
          spinner.fail((e as Error).message);
        }
        return;
      }

      const { client: wallet, account } = getWalletClient();

      // Check if already registered
      const spinner = ora("Checking registration...").start();
      try {
        const profile = await client.readContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "getAgentProfile",
          args: [account.address],
        });

        if (profile.isRegistered) {
          spinner.stop();
          success(`Already registered: ${addrLink(account.address)}`);
          console.log(`  Reputation: ${reputationColor(Number(profile.reputationScore))}`);
          return;
        }
        spinner.text = "Registering agent...";

        const hash = await wallet.writeContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "selfRegister",
        });

        spinner.text = "Waiting for confirmation...";
        await client.waitForTransactionReceipt({ hash });
        spinner.stop();

        success(`Registered: ${addrLink(account.address)}`);
        console.log(`  Transaction: ${txLink(hash)}`);
        console.log(chalk.gray("\n  Starting reputation: 100"));
        console.log(chalk.gray("  Run `jurex reputation` to view your profile."));
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });
}
