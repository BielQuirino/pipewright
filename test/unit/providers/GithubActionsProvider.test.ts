import { describe, it, expect, beforeEach } from "vitest";
import { GithubActionsProvider } from "../../../src/providers/github/GithubActionsProvider.js";
import { TemplateEngine } from "../../../src/core/TemplateEngine.js";
import { PathResolver } from "../../../src/core/PathResolver.js";
import type { PipelineContext } from "../../../src/types/index.js";

describe("GithubActionsProvider", () => {
  let provider: GithubActionsProvider;

  const baseCtx: PipelineContext = {
    projectName: "my-app",
    framework: "nestjs",
    packageManager: "npm",
    nodeVersion: "20",
    withDocker: false,
    withRelease: false,
  };

  beforeEach(() => {
    provider = new GithubActionsProvider(new TemplateEngine(), new PathResolver());
  });

  it("has correct id and label", () => {
    expect(provider.id).toBe("github");
    expect(provider.label).toBe("GitHub Actions");
  });

  it("generates ci.yml by default", async () => {
    const files = await provider.generate(baseCtx);
    const ci = files.find((f) => f.relativePath.includes("ci.yml"));
    expect(ci).toBeDefined();
    expect(ci?.contents).toContain("node-version: [20]");
  });

  it("adds docker-publish.yml when withDocker is true", async () => {
    const files = await provider.generate({ ...baseCtx, withDocker: true });
    expect(files.some((f) => f.relativePath.includes("docker-publish"))).toBe(true);
  });

  it("adds release.yml when withRelease is true", async () => {
    const files = await provider.generate({ ...baseCtx, withRelease: true });
    expect(files.some((f) => f.relativePath.includes("release"))).toBe(true);
  });

  it("uses correct package manager in scripts", async () => {
    const files = await provider.generate({ ...baseCtx, packageManager: "pnpm" });
    const ci = files.find((f) => f.relativePath.includes("ci.yml"));
    expect(ci?.contents).toContain("pnpm");
  });
});
