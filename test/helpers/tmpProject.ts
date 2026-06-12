import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export async function createTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "pipewright-test-"));
}

export async function cleanTmpDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
