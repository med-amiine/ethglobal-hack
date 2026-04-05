import chalk from "chalk";

export const CASE_STATES = [
  "Filed",
  "Active",
  "Deliberating",
  "Resolved",
  "Defaulted",
  "Appeal",
] as const;

export function stateColor(state: number): string {
  const label = CASE_STATES[state] ?? "Unknown";
  switch (state) {
    case 0: return chalk.yellow(label);
    case 1: return chalk.blue(label);
    case 2: return chalk.magenta(label);
    case 3: return chalk.green(label);
    case 4: return chalk.red(label);
    case 5: return chalk.cyan(label);
    default: return label;
  }
}

export function reputationColor(score: number): string {
  if (score >= 80) return chalk.green(score);
  if (score >= 60) return chalk.yellow(score);
  return chalk.red(score);
}

export function formatJrx(wei: bigint): string {
  return `${(Number(wei) / 1e18).toLocaleString()} JRX`;
}

export function formatEth(wei: bigint): string {
  return `${(Number(wei) / 1e18).toFixed(6)} ETH`;
}

export function header(text: string) {
  console.log("\n" + chalk.bold.white(text));
  console.log(chalk.gray("─".repeat(text.length)));
}

export function success(msg: string) {
  console.log(chalk.green("✓") + " " + msg);
}

export function warn(msg: string) {
  console.log(chalk.yellow("⚠") + " " + msg);
}

export function info(msg: string) {
  console.log(chalk.blue("ℹ") + " " + msg);
}

export function txLink(hash: string): string {
  return chalk.underline.cyan(`https://arbiscan.io/tx/${hash}`);
}

export function addrLink(addr: string): string {
  return chalk.underline.cyan(`https://arbiscan.io/address/${addr}`);
}
