import fse from "fs-extra";
import { join } from "path";
import type { EmittedFile } from "../types/index.js";
import { UserError } from "./errors.js";

export interface WriteOptions {
  targetDir: string;
  force: boolean;
  dryRun: boolean;
}

export class FileWriter {
  async writeAll(files: EmittedFile[], options: WriteOptions): Promise<WriteSummary[]> {
    const summary: WriteSummary[] = [];

    for (const file of files) {
      const absPath = join(options.targetDir, file.relativePath);
      const exists = await fse.pathExists(absPath);

      if (exists && !options.force) {
        throw new UserError(
          `File already exists: ${file.relativePath}\nUse --force to overwrite.`,
        );
      }

      const action: WriteAction = exists ? "overwrite" : "create";

      if (!options.dryRun) {
        await fse.ensureDir(join(options.targetDir, file.relativePath, ".."));
        await fse.writeFile(absPath, file.contents, "utf-8");
      }

      summary.push({ relativePath: file.relativePath, action });
    }

    return summary;
  }
}

export type WriteAction = "create" | "overwrite";

export interface WriteSummary {
  relativePath: string;
  action: WriteAction;
}
