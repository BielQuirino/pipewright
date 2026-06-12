import ora, { type Ora } from "ora";

export class Spinner {
  private instance: Ora | null = null;
  private readonly enabled: boolean;

  constructor(spinnerEnabled: boolean) {
    this.enabled = spinnerEnabled && process.stdout.isTTY && !process.env["CI"];
  }

  start(text: string): void {
    if (this.enabled) {
      this.instance = ora(text).start();
    } else {
      process.stdout.write(text + "...\n");
    }
  }

  succeed(text: string): void {
    if (this.instance) {
      this.instance.succeed(text);
      this.instance = null;
    } else {
      process.stdout.write("✔ " + text + "\n");
    }
  }

  fail(text: string): void {
    if (this.instance) {
      this.instance.fail(text);
      this.instance = null;
    } else {
      process.stderr.write("✖ " + text + "\n");
    }
  }

  stop(): void {
    if (this.instance) {
      this.instance.stop();
      this.instance = null;
    }
  }
}
