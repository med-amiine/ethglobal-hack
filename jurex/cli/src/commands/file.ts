import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { getPublicClient, getWalletClient } from "../client.js";
import { CONTRACTS, FACTORY_ABI } from "../config.js";
import { header, success, txLink, addrLink, formatEth } from "../ui.js";

export function fileCommand(program: Command) {
  program
    .command("file")
    .description("File a new dispute case")
    .option("--defendant <address>", "Defendant agent address")
    .option("--claim <description>", "Short description of the dispute claim")
    .option("--evidence <ipfsHash>", "IPFS hash of evidence (optional)")
    .action(async (opts) => {
      header("File a Dispute");

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "defendant",
          message: "Defendant address (0x...):",
          when: !opts.defendant,
          validate: (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v) || "Must be a valid Ethereum address",
        },
        {
          type: "input",
          name: "claim",
          message: "Claim description (what went wrong):",
          when: !opts.claim,
          validate: (v: string) => v.trim().length > 0 || "Claim description is required",
        },
        {
          type: "input",
          name: "evidence",
          message: "Evidence IPFS hash (leave blank to skip):",
          when: !opts.evidence,
          default: "",
        },
      ]);

      const defendant = (opts.defendant ?? answers.defendant) as `0x${string}`;
      const claim = (opts.claim ?? answers.claim) as string;
      const evidence = (opts.evidence ?? answers.evidence ?? "") as string;

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

      console.log(`\n  Plaintiff:  ${account.address}`);
      console.log(`  Defendant:  ${defendant}`);
      console.log(`  Claim:      ${claim}`);
      console.log(`  Evidence:   ${evidence || chalk.gray("(none)")}`);
      console.log(`  Stake:      ${formatEth(baseFee)} (required)`);

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "File this case?",
          default: true,
        },
      ]);
      if (!confirm) return;

      const spin2 = ora("Submitting transaction...").start();
      try {
        const hash = await wallet.writeContract({
          address: CONTRACTS.CourtCaseFactory,
          abi: FACTORY_ABI,
          functionName: "fileNewCase",
          args: [defendant, claim, evidence],
          value: baseFee,
        });
        spin2.text = "Waiting for confirmation...";

        const receipt = await client.waitForTransactionReceipt({ hash });
        spin2.stop();

        // Extract case address from logs (first contract created in receipt)
        const caseAddress = receipt.contractAddress ?? receipt.logs[0]?.address;

        success("Case filed!");
        console.log(`  Case:        ${addrLink(caseAddress ?? "unknown")}`);
        console.log(`  Transaction: ${txLink(hash)}`);
        console.log(chalk.gray("\n  The defendant has 24 hours to respond."));
        console.log(chalk.gray("  Run `jurex cases get " + (caseAddress ?? hash) + "` to track status."));
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
      }
    });
}
