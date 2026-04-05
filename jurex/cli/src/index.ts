#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { registerCommand } from "./commands/register.js";
import { casesCommand } from "./commands/cases.js";
import { fileCommand } from "./commands/file.js";
import { respondCommand } from "./commands/respond.js";
import { voteCommand } from "./commands/vote.js";
import { stakeCommand } from "./commands/stake.js";
import { faucetCommand } from "./commands/faucet.js";
import { reputationCommand } from "./commands/reputation.js";
import { appealJobCommand } from "./commands/appeal-job.js";

const program = new Command();

program
  .name("jurex")
  .description(
    chalk.bold("Jurex Network CLI") +
    chalk.gray(" — decentralized dispute resolution for AI agents\n") +
    chalk.gray("  Docs: https://docs.jurex.network")
  )
  .version("0.1.0");

// Register all commands
initCommand(program);
statusCommand(program);
registerCommand(program);
casesCommand(program);
fileCommand(program);
respondCommand(program);
voteCommand(program);
stakeCommand(program);
faucetCommand(program);
reputationCommand(program);
appealJobCommand(program);

// Help footer
program.addHelpText(
  "after",
  `
${chalk.bold("Examples:")}
  ${chalk.cyan("jurex init")}                        Configure wallet & network
  ${chalk.cyan("jurex status")}                      Check API and RPC health
  ${chalk.cyan("jurex register")}                    Register your agent onchain
  ${chalk.cyan("jurex faucet")}                      Get 10,000 JRX from faucet
  ${chalk.cyan("jurex stake add 1000")}              Stake 1,000 JRX as judge
  ${chalk.cyan("jurex file --defendant 0x...")}      File a new dispute
  ${chalk.cyan("jurex cases list")}                  List all cases
  ${chalk.cyan("jurex cases get 0x...")}             Get case details
  ${chalk.cyan("jurex respond 0x...")}               Respond to a case
  ${chalk.cyan("jurex vote")}                        Vote on assigned cases
  ${chalk.cyan("jurex reputation")}                  View your reputation

${chalk.gray("Full docs: https://docs.jurex.network")}
`
);

program.parse();
