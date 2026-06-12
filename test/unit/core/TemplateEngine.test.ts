import { describe, it, expect, beforeEach } from "vitest";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { TemplateEngine } from "../../../src/core/TemplateEngine.js";
import { InternalError } from "../../../src/core/errors.js";

describe("TemplateEngine", () => {
  let engine: TemplateEngine;
  let tmpDir: string;

  beforeEach(async () => {
    engine = new TemplateEngine();
    tmpDir = await mkdtemp(join(tmpdir(), "pw-test-"));
  });

  it("renders a simple EJS template", async () => {
    const tpl = join(tmpDir, "hello.ejs");
    await writeFile(tpl, "Hello <%= name %>!");

    const result = await engine.render(tpl, { name: "World" });
    expect(result).toBe("Hello World!");
  });

  it("renders conditional blocks", async () => {
    const tpl = join(tmpDir, "cond.ejs");
    await writeFile(tpl, "<% if (flag) { %>yes<% } else { %>no<% } %>");

    expect(await engine.render(tpl, { flag: true })).toBe("yes");
    expect(await engine.render(tpl, { flag: false })).toBe("no");
  });

  it("throws InternalError when template file does not exist", async () => {
    await expect(engine.render("/non/existent/template.ejs", {})).rejects.toThrow(InternalError);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });
});
