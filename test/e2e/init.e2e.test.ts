import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { pathExists, readFile } from "fs-extra";
import { join } from "path";
import { createTmpDir, cleanTmpDir } from "../helpers/tmpProject.js";
import { runCli } from "../helpers/runCli.js";

describe("pipewright init (e2e)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTmpDir();
  });

  afterEach(async () => {
    await cleanTmpDir(tmpDir);
  });

  it("scaffolds a NestJS project with --yes flag", async () => {
    const result = await runCli(
      ["init", "test-nest", "--framework", "nestjs", "--provider", "github", "--yes", "--cwd", tmpDir],
    );

    expect(result.exitCode).toBe(0);

    const projectDir = join(tmpDir, "test-nest");
    expect(await pathExists(join(projectDir, "package.json"))).toBe(true);
    expect(await pathExists(join(projectDir, "src/main.ts"))).toBe(true);
    expect(await pathExists(join(projectDir, ".github/workflows/ci.yml"))).toBe(true);

    const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8")) as { name: string };
    expect(pkg.name).toBe("test-nest");
  });

  it("dry-run does not write files", async () => {
    await runCli(
      ["init", "dry-app", "--framework", "nestjs", "--yes", "--dry-run", "--cwd", tmpDir],
    );

    expect(await pathExists(join(tmpDir, "dry-app"))).toBe(false);
  });
});
