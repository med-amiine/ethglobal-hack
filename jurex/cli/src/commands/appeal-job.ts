import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { getPublicClient, getWalletClient } from "../client.js";
import { CONTRACTS, FACTORY_ABI } from "../config.js";
import { header, success, txLink, addrLink, formatEth } from "../ui.js";

export function appealJobCommand(program: Command) {
  program
    .command("appeal-job")
    .description("File an ERC-8183 job appeal after a rejection (provider only)")
    .option("--job-id <id>", "ERC-8183 job ID from AgenticCommerce")
    .option("--job-contract <address>", "AgenticCommerce contract address")
    .option("--hook <address>", "AgentCourtHook contract address")
    .option("--evidence <ipfsHash>", "IPFS hash of appeal evidence (optional)")
    .action(async (opts) => {
      header("File a Job Appeal (ERC-8183)");

      console.log(chalk.gray(
        "  You are the job provider appealing an evaluator's rejection.\n" +
        "  A 3-judge Jurex panel will review the work and render a binding verdict.\n"
      ));

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "jobId",
          message: "Job ID (from AgenticCommerce):",
          when: !opts.jobId,
          validate: (v: string) => /^\d+$/.test(v) || "Must be a number",
        },
        {
          type: "input",
          name: "jobContract",
          message: "AgenticCommerce contract address (0x...):",
          when: !opts.jobContract,
          validate: (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v) || "Must be a valid address",
        },
        {
          type: "input",
          name: "hook",
          message: `AgentCourtHook address (default: ${CONTRACTS.AgentCourtHook}):`,
          when: !opts.hook,
          default: CONTRACTS.AgentCourtHook,
        },
        {
          type: "input",
          name: "evidence",
          message: "Evidence IPFS hash (leave blank to skip):",
          when: !opts.evidence,
          default: "",
        },
      ]);

      const jobId = BigInt((opts.jobId ?? answers.jobId) as string);
      const jobContract = (opts.jobContract ?? answers.jobContract) as `0x${string}`;
      const hookContract = (opts.hook ?? answers.hook ?? CONTRACTS.AgentCourtHook) as `0x${string}`;
      const evidence = ((opts.evidence ?? answers.evidence ?? "") as string) || "appeal";

      const { client: wallet, account } = getWalletClient();
      const client = getPublicClient();

      const spinner = ora("Fetching base fee...").start();
      let baseFee: bigint;
      try {
        baseFee = await client.readContract({
          address: CONTRACTS.CourtCaseFactory,
          abi: FACTORY_ABI,
          functionName: "BASE_FEE",
        });
        spinner.stop();
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
        return;
      }

      const stake = baseFee * 2n;

      console.log(`\n  Provider:     ${account.address}`);
      console.log(`  Job ID:       ${jobId}`);
      console.log(`  Job contract: ${addrLink(jobContract)}`);
      console.log(`  Hook:         ${addrLink(hookContract)}`);
      console.log(`  Evidence:     ${evidence === "appeal" ? chalk.gray("(none)") : evidence}`);
      console.log(`  Stake:        ${formatEth(stake)} (2x base fee)`);

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "File this job appeal?",
          default: true,
        },
      ]);
      if (!confirm) return;

      const spin2 = ora("Submitting transaction...").start();
      try {
        const hash = await wallet.writeContract({
          address: CONTRACTS.CourtCaseFactory,
          abi: FACTORY_ABI,
          functionName: "fileAppeal",
          args: [jobId, jobContract, hookContract, evidence],
          value: stake,
        });
        spin2.text = "Waiting for confirmation...";

        const receipt = await client.waitForTransactionReceipt({ hash });
        spin2.stop();

        const caseAddress = receipt.logs[receipt.logs.length - 1]?.address;

        success("Job appeal filed!");
        console.log(`  Case:         ${addrLink(caseAddress ?? "")}`);
        console.log(`  Transaction:  ${txLink(hash)}`);
        console.log(chalk.gray(
          "\n  The evaluator (defendant) has 48 hours to respond.\n" +
          "  Jurex will assign 3 judges once both parties have staked.\n" +
          "  Run `jurex cases get " + (caseAddress ?? hash) + "` to track status."
        ));
        console.log(chalk.yellow(
          "\n  Note: Ask the Jurex admin to call hook.linkCase(" + jobId + ", " + (caseAddress ?? "") + ")\n" +
          "  so that settleAppeal() can finalize the job after the verdict."
        ));
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
      }
    });
}
