import { describe, it, expect, beforeEach } from "vitest";
import { NestjsGenerator } from "../../../src/generators/nestjs/NestjsGenerator.js";
import { TemplateEngine } from "../../../src/core/TemplateEngine.js";
import { PathResolver } from "../../../src/core/PathResolver.js";

describe("NestjsGenerator", () => {
  let generator: NestjsGenerator;

  beforeEach(() => {
    generator = new NestjsGenerator(new TemplateEngine(), new PathResolver());
  });

  it("has correct id", () => {
    expect(generator.id).toBe("nestjs");
  });

  it("generates expected files", async () => {
    const files = await generator.generate({
      projectName: "test-app",
      targetDir: "/tmp/test-app",
      packageManager: "npm",
    });

    const paths = files.map((f) => f.relativePath);
    expect(paths).toContain("package.json");
    expect(paths).toContain("src/main.ts");
    expect(paths).toContain("src/app.module.ts");
    expect(paths).toContain("src/app.controller.ts");
    expect(paths).toContain("src/app.service.ts");
  });

  it("includes project name in package.json", async () => {
    const files = await generator.generate({
      projectName: "my-nest-app",
      targetDir: "/tmp/my-nest-app",
      packageManager: "npm",
    });

    const pkg = files.find((f) => f.relativePath === "package.json");
    expect(pkg?.contents).toContain('"name": "my-nest-app"');
  });
});
