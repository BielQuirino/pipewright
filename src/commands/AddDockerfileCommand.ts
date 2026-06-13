import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { BaseCommand } from "./Command.js";
import type { FrameworkId, PackageManager } from "../types/index.js";

interface AddDockerfileOptions {
  framework?: FrameworkId;
  port?: string;
  node?: string;
}

export class AddDockerfileCommand extends BaseCommand {
  register(program: Command): void {
    const add = this.findOrCreateAddCommand(program);

    add
      .command("dockerfile")
      .description("Add an optimized multi-stage Dockerfile")
      .option("-f, --framework <framework>", "nestjs | vue (auto-detected if omitted)")
      .option("--port <port>", "Exposed port")
      .option("--node <version>", "Base image Node version", "20")
      .action(async (opts: AddDockerfileOptions) => {
        await this.run(opts);
      });
  }

  async run(opts: unknown): Promise<void> {
    const options = opts as AddDockerfileOptions;
    const { logger, spinner, prompter, fileWriter, generators, flags } = this.ctx;

    const detected = await this.detectMeta(flags.cwd);

    const answers = await prompter.ask([
      {
        name: "framework",
        type: "list",
        message: "Framework:",
        choices: [
          { name: "NestJS", value: "nestjs" },
          { name: "Vue 3", value: "vue" },
        ],
        default: detected.framework,
        when: () => !options.framework,
      },
      {
        name: "nodeVersion",
        type: "input",
        message: "Node version for base image:",
        default: options.node ?? "20",
      },
      {
        name: "port",
        type: "input",
        message: "Exposed port:",
        default: options.port ?? (detected.framework === "vue" ? "80" : "3000"),
      },
    ]);

    const framework = (options.framework ?? (answers["framework"] as FrameworkId)) as FrameworkId;
    const nodeVersion = (answers["nodeVersion"] as string) ?? options.node ?? "20";
    const port = (answers["port"] as string) ?? options.port ?? "3000";

    spinner.start("Generating Dockerfile");

    const generator = generators.resolve("dockerfile");
    const files = await generator.generate({
      projectName: detected.projectName,
      targetDir: flags.cwd,
      packageManager: detected.packageManager,
      framework,
      nodeVersion,
      port,
    });

    spinner.succeed("Dockerfile generated");

    const summary = await fileWriter.writeAll(files, {
      targetDir: flags.cwd,
      force: flags.force,
      dryRun: flags.dryRun,
    });

    logger.blank();
    for (const entry of summary) {
      const label = entry.action === "create" ? chalk.green("create") : chalk.yellow("overwrite");
      logger.info(`  ${label}  ${entry.relativePath}`);
    }
    logger.blank();

    if (flags.dryRun) {
      logger.warn("Dry run — no files were written.");
      return;
    }

    logger.success("Dockerfile added successfully.");
  }

  private findOrCreateAddCommand(program: Command): Command {
    const existing = program.commands.find((c) => c.name() === "add");
    return existing ?? program.command("add").description("Add artifacts to an existing project");
  }

  private async detectMeta(
    cwd: string,
  ): Promise<{ framework: FrameworkId; projectName: string; packageManager: PackageManager }> {
    try {
      const raw = await readFile(join(cwd, "package.json"), "utf-8");
      const pkg = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const framework: FrameworkId = "vue" in deps ? "vue" : "nestjs";
      const { pathExists } = await import("fs-extra");
      const packageManager: PackageManager =
        (await pathExists(join(cwd, "pnpm-lock.yaml")))
          ? "pnpm"
          : (await pathExists(join(cwd, "yarn.lock")))
            ? "yarn"
            : "npm";
      return { framework, projectName: pkg.name ?? "app", packageManager };
    } catch {
      return { framework: "nestjs", projectName: "app", packageManager: "npm" };
    }
  }
}
