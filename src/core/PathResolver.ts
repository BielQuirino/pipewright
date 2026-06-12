import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync } from "fs";

export class PathResolver {
  private readonly fileDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    this.fileDir = dirname(__filename);
  }

  templatesRoot(): string {
    const candidates = [
      join(this.fileDir, "templates"),
      join(this.fileDir, "..", "templates"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }

    return candidates[0] as string;
  }

  templatePath(relativePath: string): string {
    return join(this.templatesRoot(), relativePath);
  }

  resolve(cwd: string, ...segments: string[]): string {
    return resolve(cwd, ...segments);
  }
}
