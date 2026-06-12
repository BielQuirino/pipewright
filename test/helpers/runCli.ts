import { execa, type ExecaReturnValue } from "execa";
import { resolve } from "path";

const cliBin = resolve(process.cwd(), "dist/cli.js");

export async function runCli(
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {},
): Promise<ExecaReturnValue> {
  return execa("node", [cliBin, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...options.env },
    reject: false,
  });
}
