import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { getPublicClient, getWalletClient, api } from "../client.js";
import { CASE_ABI } from "../config.js";
import { header, success, txLink, stateColor, info } from "../ui.js";

interface PendingCase {
  address: string;
  caseId: number;
  plaintiff: string;
  defendant: string;
  evidenceHash?: string;
}

export function voteCommand(program: Command) {
  program
    .command("vote [caseAddress]")
    .description("Submit a vote on an assigned case")
    .option("--plaintiff", "Vote in favor of the plaintiff")
    .option("--defendant", "Vote in favor of the defendant")
    .action(async (caseAddress: string | undefined, opts) => {
      header("Submit Vote");

      const { account } = getWalletClient();
      const client = getPublicClient();

      // If no case given, show pending cases for this judge
      if (!caseAddress) {
        const spinner = ora("Fetching pending cases for your address...").start();
        try {
          const pending = await api<PendingCase[]>(`/validate/pending/${account.address}`);
          spinner.stop();

          if (pending.length === 0) {
            info("No pending cases assigned to you.");
            return;
          }

          console.log(chalk.gray(`  ${pending.length} case(s) pending your vote:\n`));
          for (const c of pending) {
            console.log(`  ${chalk.bold(`#${c.caseId}`)} ${chalk.cyan(c.address)}`);
            console.log(`    Plaintiff: ${c.plaintiff}`);
            console.log(`    Defendant: ${c.defendant}`);
            if (c.evidenceHash) console.log(`    Evidence:  ${chalk.gray(c.evidenceHash)}`);
            console.log();
          }

          const { selected } = await inquirer.prompt([
            {
              type: "list",
              name: "selected",
              message: "Which case to vote on?",
              choices: pending.map((c) => ({ name: `#${c.caseId} — ${c.address}`, value: c.address })),
            },
          ]);
          caseAddress = selected;
        } catch (e: unknown) {
          spinner.fail((e as Error).message);
          process.exit(1);
          return;
        }
      }

      const addr = caseAddress as `0x${string}`;

      // Check state
      const spin2 = ora("Checking case state...").start();
      try {
        const state = await client.readContract({ address: addr, abi: CASE_ABI, functionName: "state" });
        spin2.stop();
        if (state !== 2) {
          console.log(`  State: ${stateColor(state)}`);
          console.log(chalk.red("  Cannot vote — case is not in Deliberating state."));
          process.exit(1);
        }
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
        return;
      }

      let plaintiffWins: boolean;
      if (opts.plaintiff) {
        plaintiffWins = true;
      } else if (opts.defendant) {
        plaintiffWins = false;
      } else {
        const { vote } = await inquirer.prompt([
          {
            type: "list",
            name: "vote",
            message: "Your vote:",
            choices: [
              { name: "Plaintiff wins", value: true },
              { name: "Defendant wins", value: false },
            ],
          },
        ]);
        plaintiffWins = vote;
      }

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Confirm: vote ${plaintiffWins ? chalk.green("Plaintiff wins") : chalk.red("Defendant wins")}?`,
          default: true,
        },
      ]);
      if (!confirm) return;

      const { client: wallet } = getWalletClient();
      const spin3 = ora("Submitting vote...").start();
      try {
        const hash = await wallet.writeContract({
          address: addr,
          abi: CASE_ABI,
          functionName: "submitVote",
          args: [plaintiffWins],
        });
        spin3.text = "Waiting for confirmation...";
        await client.waitForTransactionReceipt({ hash });
        spin3.stop();

        success(`Vote submitted: ${plaintiffWins ? chalk.green("Plaintiff wins") : chalk.red("Defendant wins")}`);
        console.log(`  Transaction: ${txLink(hash)}`);
        console.log(chalk.gray("\n  Earning ~50 JRX if your vote is in the majority."));
      } catch (e: unknown) {
        spin3.fail((e as Error).message);
        process.exit(1);
      }
    });
}
