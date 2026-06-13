import { defineConfig } from "tsup";
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import { join } from "path";

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const info = await stat(srcPath);
    if (info.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

const external = ["commander", "@inquirer/prompts", "chalk", "ora", "ejs", "fs-extra"];

export default defineConfig([
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    banner: { js: "#!/usr/bin/env node" },
    dts: false,
    clean: true,
    external,
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    shims: true,
    dts: true,
    clean: false,
    external,
    async onSuccess() {
      await copyDir("src/templates", "dist/templates");
    },
  },
]);
