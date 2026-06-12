import chalk from "chalk";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export class Logger {
  constructor(private readonly silent: boolean) {}

  info(message: string): void {
    if (!this.silent) process.stdout.write(chalk.cyan("ℹ ") + message + "\n");
  }

  warn(message: string): void {
    if (!this.silent) process.stderr.write(chalk.yellow("⚠ ") + message + "\n");
  }

  error(message: string): void {
    process.stderr.write(chalk.red("✖ ") + message + "\n");
  }

  success(message: string): void {
    if (!this.silent) process.stdout.write(chalk.green("✔ ") + message + "\n");
  }

  debug(message: string): void {
    if (process.env["DEBUG"] === "pipewright") {
      process.stdout.write(chalk.gray("[debug] ") + message + "\n");
    }
  }

  blank(): void {
    if (!this.silent) process.stdout.write("\n");
  }
}
