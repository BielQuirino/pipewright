import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { FileWriter } from "../../../src/core/FileWriter.js";
import { UserError } from "../../../src/core/errors.js";

describe("FileWriter", () => {
  let writer: FileWriter;
  let tmpDir: string;

  beforeEach(async () => {
    writer = new FileWriter();
    tmpDir = await mkdtemp(join(tmpdir(), "pw-writer-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writes files to target directory", async () => {
    await writer.writeAll(
      [{ relativePath: "hello.txt", contents: "world" }],
      { targetDir: tmpDir, force: false, dryRun: false },
    );

    const content = await readFile(join(tmpDir, "hello.txt"), "utf-8");
    expect(content).toBe("world");
  });

  it("creates nested directories as needed", async () => {
    await writer.writeAll(
      [{ relativePath: "a/b/c.txt", contents: "nested" }],
      { targetDir: tmpDir, force: false, dryRun: false },
    );

    const content = await readFile(join(tmpDir, "a/b/c.txt"), "utf-8");
    expect(content).toBe("nested");
  });

  it("throws UserError on conflict without --force", async () => {
    const files = [{ relativePath: "file.txt", contents: "v1" }];
    await writer.writeAll(files, { targetDir: tmpDir, force: false, dryRun: false });

    await expect(
      writer.writeAll(
        [{ relativePath: "file.txt", contents: "v2" }],
        { targetDir: tmpDir, force: false, dryRun: false },
      ),
    ).rejects.toThrow(UserError);
  });

  it("overwrites on conflict with --force", async () => {
    const files = [{ relativePath: "file.txt", contents: "v1" }];
    await writer.writeAll(files, { targetDir: tmpDir, force: false, dryRun: false });

    await writer.writeAll(
      [{ relativePath: "file.txt", contents: "v2" }],
      { targetDir: tmpDir, force: true, dryRun: false },
    );

    const content = await readFile(join(tmpDir, "file.txt"), "utf-8");
    expect(content).toBe("v2");
  });

  it("does not write files in dry-run mode", async () => {
    const summary = await writer.writeAll(
      [{ relativePath: "dry.txt", contents: "nope" }],
      { targetDir: tmpDir, force: false, dryRun: true },
    );

    expect(summary[0]?.action).toBe("create");
    const fse = await import("fs-extra");
    expect(await fse.pathExists(join(tmpDir, "dry.txt"))).toBe(false);
  });
});
