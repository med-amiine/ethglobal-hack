import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { getPublicClient, getWalletClient, api } from "../client.js";
import { CONTRACTS, REGISTRY_ABI, JRX_ABI } from "../config.js";
import { header, reputationColor, formatJrx } from "../ui.js";

interface ReputationResponse {
  address: string;
  reputationScore: number;
  trustTier: string;
  casesWon: number;
  casesLost: number;
  noShows: number;
  registeredAt: number;
  isBlacklisted: boolean;
  isRisky: boolean;
}

const TRUST_TIERS: Record<string, string> = {
  Verified: chalk.green("Verified"),
  Standard: chalk.blue("Standard"),
  Probation: chalk.yellow("Probation"),
  Banned: chalk.red("Banned"),
};

export function reputationCommand(program: Command) {
  program
    .command("reputation [address]")
    .alias("rep")
    .description("View agent reputation profile (defaults to your wallet)")
    .action(async (addrArg?: string) => {
      header("Agent Reputation");

      let target: string;

      if (addrArg) {
        target = addrArg;
      } else {
        const { account } = getWalletClient();
        target = account.address;
      }

      const spinner = ora("Loading profile...").start();
      try {
        // Try API first (richer response), fall back to onchain
        let rep: ReputationResponse | null = null;
        try {
          rep = await api<ReputationResponse>(`/agent/reputation/${target}`);
        } catch {
          // Fall back to onchain read
        }

        spinner.stop();

        if (rep) {
          const tier = TRUST_TIERS[rep.trustTier] ?? rep.trustTier;
          console.log(`  Address:    ${chalk.cyan(target)}`);
          console.log(`  Score:      ${reputationColor(rep.reputationScore)}/100`);
          console.log(`  Tier:       ${tier}`);
          console.log(`  Cases won:  ${chalk.green(String(rep.casesWon))}`);
          console.log(`  Cases lost: ${chalk.red(String(rep.casesLost))}`);
          console.log(`  No-shows:   ${chalk.yellow(String(rep.noShows))}`);
          if (rep.isBlacklisted) console.log(`  ${chalk.bgRed.white(" BLACKLISTED ")}`);
          else if (rep.isRisky) console.log(`  ${chalk.bgYellow.black(" RISKY ")}`);
        } else {
          // Onchain fallback
          const client = getPublicClient();
          const profile = await client.readContract({
            address: CONTRACTS.CourtRegistry,
            abi: REGISTRY_ABI,
            functionName: "getAgentProfile",
            args: [target as `0x${string}`],
          });

          if (!profile.isRegistered) {
            console.log(`  ${chalk.gray(target)} is not registered.`);
            return;
          }

          console.log(`  Address:    ${chalk.cyan(target)}`);
          console.log(`  Score:      ${reputationColor(Number(profile.reputationScore))}/100`);
          console.log(`  Cases won:  ${chalk.green(String(profile.casesWon))}`);
          console.log(`  Cases lost: ${chalk.red(String(profile.casesLost))}`);
          console.log(`  No-shows:   ${chalk.yellow(String(profile.noShows))}`);

          // JRX stake
          const stake = await client.readContract({
            address: CONTRACTS.CourtRegistry,
            abi: REGISTRY_ABI,
            functionName: "judgeStakes",
            args: [target as `0x${string}`],
          });
          if (stake > 0n) {
            console.log(`  Judge stake: ${formatJrx(stake)}`);
          }
        }
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });
}
