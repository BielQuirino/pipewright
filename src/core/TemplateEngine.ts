import ejs from "ejs";
import { readFile } from "fs/promises";
import type { RenderContext } from "../types/index.js";
import { InternalError } from "./errors.js";

export class TemplateEngine {
  async render(templateAbsPath: string, ctx: RenderContext): Promise<string> {
    let source: string;
    try {
      source = await readFile(templateAbsPath, "utf-8");
    } catch {
      throw new InternalError(`Template not found: ${templateAbsPath}`);
    }

    try {
      return ejs.render(source, ctx, { async: false });
    } catch (err) {
      throw new InternalError(
        `Failed to render template ${templateAbsPath}: ${(err as Error).message}`,
      );
    }
  }
}
