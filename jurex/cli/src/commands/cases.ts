import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { api } from "../client.js";
import { header, stateColor, formatEth, info } from "../ui.js";

interface CaseSummary {
  address: string;
  plaintiff: string;
  defendant: string;
  state: number;
  stake: string;
  caseId: number;
  createdAt?: number;
}

interface CaseDetail extends CaseSummary {
  evidenceHash?: string;
  judge1?: string;
  judge2?: string;
  judge3?: string;
  verdictPlaintiffWins?: boolean | null;
  verdictReason?: string;
}

export function casesCommand(program: Command) {
  const cmd = program
    .command("cases")
    .description("List and inspect dispute cases");

  // jurex cases list
  cmd
    .command("list")
    .description("List all cases")
    .option("--state <n>", "Filter by state (0=Filed 1=Active 2=Deliberating 3=Resolved 4=Defaulted 5=Appeal)")
    .option("--limit <n>", "Max results", "20")
    .action(async (opts) => {
      header("Cases");
      const spinner = ora("Loading...").start();
      try {
        const cases = await api<CaseSummary[]>("/cases");
        spinner.stop();

        let filtered = cases;
        if (opts.state !== undefined) {
          filtered = cases.filter((c) => c.state === Number(opts.state));
        }
        filtered = filtered.slice(0, Number(opts.limit));

        if (filtered.length === 0) {
          info("No cases found.");
          return;
        }

        for (const c of filtered) {
          console.log(
            `  ${chalk.bold(`#${c.caseId}`).padEnd(8)} ${stateColor(c.state).padEnd(20)} ` +
            `${chalk.gray(c.address.slice(0, 10) + "...")} ` +
            `${chalk.gray("stake:")} ${formatEth(BigInt(c.stake || "0"))}`
          );
        }
        console.log(chalk.gray(`\n  ${filtered.length} case(s). Run \`jurex cases get <address>\` for details.`));
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });

  // jurex cases get <address>
  cmd
    .command("get <address>")
    .description("Get full details for a case")
    .action(async (address: string) => {
      header(`Case ${address.slice(0, 10)}...`);
      const spinner = ora("Loading...").start();
      try {
        const c = await api<CaseDetail>(`/cases/${address}`);
        spinner.stop();

        console.log(`  Address:    ${chalk.cyan(c.address)}`);
        console.log(`  State:      ${stateColor(c.state)}`);
        console.log(`  Plaintiff:  ${c.plaintiff}`);
        console.log(`  Defendant:  ${c.defendant}`);
        console.log(`  Stake:      ${formatEth(BigInt(c.stake || "0"))}`);
        if (c.evidenceHash) console.log(`  Evidence:   ${chalk.gray(c.evidenceHash)}`);
        if (c.judge1) {
          console.log(`  Judges:`);
          console.log(`    ${chalk.gray("1.")} ${c.judge1}`);
          if (c.judge2) console.log(`    ${chalk.gray("2.")} ${c.judge2}`);
          if (c.judge3) console.log(`    ${chalk.gray("3.")} ${c.judge3}`);
        }
        if (c.verdictPlaintiffWins !== undefined && c.verdictPlaintiffWins !== null) {
          const verdict = c.verdictPlaintiffWins
            ? chalk.green("Plaintiff wins")
            : chalk.red("Defendant wins");
          console.log(`  Verdict:    ${verdict}`);
          if (c.verdictReason) console.log(`  Reason:     ${chalk.gray(c.verdictReason)}`);
        }
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
      }
    });
}
