import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { getPublicClient, getWalletClient } from "../client.js";
import { CASE_ABI } from "../config.js";
import { header, success, txLink, formatEth, stateColor } from "../ui.js";

export function respondCommand(program: Command) {
  program
    .command("respond <caseAddress>")
    .description("Respond to a case as the defendant")
    .option("--evidence <ipfsHash>", "IPFS hash of your counter-evidence")
    .action(async (caseAddress: string, opts) => {
      header("Respond to Case");

      const client = getPublicClient();
      const addr = caseAddress as `0x${string}`;

      const spinner = ora("Loading case...").start();
      let state: number;
      let baseFee: bigint;
      try {
        [state, baseFee] = await Promise.all([
          client.readContract({ address: addr, abi: CASE_ABI, functionName: "state" }),
          client.readContract({ address: addr, abi: CASE_ABI, functionName: "BASE_FEE" }),
        ]);
        spinner.stop();
      } catch (e: unknown) {
        spinner.fail((e as Error).message);
        process.exit(1);
        return;
      }

      if (state !== 0) {
        console.log(`  Case state: ${stateColor(state)}`);
        console.log(chalk.red("  Cannot respond — case is not in Filed state."));
        process.exit(1);
      }

      console.log(`  Case:   ${chalk.cyan(caseAddress)}`);
      console.log(`  Fee:    ${formatEth(baseFee)} (required to respond)`);

      const { confirm } = await inquirer.prompt([
        { type: "confirm", name: "confirm", message: "Submit response?", default: true },
      ]);
      if (!confirm) return;

      const { client: wallet } = getWalletClient();
      const spin2 = ora("Sending response...").start();
      try {
        const hash = await wallet.writeContract({
          address: addr,
          abi: CASE_ABI,
          functionName: "respondToCase",
          value: baseFee,
        });
        spin2.text = "Waiting for confirmation...";
        await client.waitForTransactionReceipt({ hash });
        spin2.stop();

        success("Response submitted!");
        console.log(`  Transaction: ${txLink(hash)}`);

        // Submit evidence if provided
        if (opts.evidence) {
          const spin3 = ora("Submitting evidence...").start();
          const h2 = await wallet.writeContract({
            address: addr,
            abi: CASE_ABI,
            functionName: "submitEvidence",
            args: [opts.evidence],
          });
          await client.waitForTransactionReceipt({ hash: h2 });
          spin3.stop();
          success(`Evidence submitted: ${chalk.gray(opts.evidence)}`);
          console.log(`  Transaction: ${txLink(h2)}`);
        }

        console.log(chalk.gray("\n  Case is now Active. Judges will be assigned shortly."));
      } catch (e: unknown) {
        spin2.fail((e as Error).message);
        process.exit(1);
      }
    });
}
