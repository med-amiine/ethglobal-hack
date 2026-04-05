import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { config } from "../config.js";
import { header, success } from "../ui.js";

export function initCommand(program: Command) {
  program
    .command("init")
    .description("Configure your wallet and network settings")
    .option("--key <privateKey>", "Private key (0x...)")
    .option("--rpc <url>", "Custom RPC URL")
    .option("--api <url>", "Custom API URL")
    .action(async (opts) => {
      header("Jurex CLI — Setup");

      let privateKey = opts.key;
      let rpcUrl = opts.rpc;
      let apiUrl = opts.api;

      if (!privateKey || !rpcUrl || !apiUrl) {
        const answers = await inquirer.prompt([
          {
            type: "password",
            name: "privateKey",
            message: "Private key (0x...):",
            when: !privateKey,
            validate: (v: string) =>
              /^0x[0-9a-fA-F]{64}$/.test(v) || "Must be a 32-byte hex key starting with 0x",
          },
          {
            type: "input",
            name: "rpcUrl",
            message: "Arbitrum One RPC URL:",
            when: !rpcUrl,
            default: "https://arb1.arbitrum.io/rpc",
          },
          {
            type: "input",
            name: "apiUrl",
            message: "Jurex API URL:",
            when: !apiUrl,
            default: "https://jurex-api-production.up.railway.app",
          },
        ]);
        privateKey = privateKey ?? answers.privateKey;
        rpcUrl = rpcUrl ?? answers.rpcUrl;
        apiUrl = apiUrl ?? answers.apiUrl;
      }

      config.set("privateKey", privateKey);
      config.set("rpcUrl", rpcUrl);
      config.set("apiUrl", apiUrl);

      success("Config saved to " + chalk.gray(config.path));
      console.log(chalk.gray("\nRun `jurex status` to verify your connection."));
    });
}
