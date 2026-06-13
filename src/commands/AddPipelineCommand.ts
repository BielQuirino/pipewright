import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { BaseCommand } from "./Command.js";
import type { FrameworkId, ProviderId, PackageManager } from "../types/index.js";

interface AddPipelineOptions {
  provider?: ProviderId;
  node?: string;
  docker?: boolean;
  release?: boolean;
}

export class AddPipelineCommand extends BaseCommand {
  register(program: Command): void {
    const add = program.command("add").description("Add artifacts to an existing project");

    add
      .command("pipeline")
      .description("Add a CI/CD pipeline to the current project")
      .option("-p, --provider <provider>", "github | azure | gitlab")
      .option("--node <version>", "Node version for CI", "20")
      .option("--docker", "Include Docker publish job")
      .option("--release", "Include release pipeline")
      .action(async (opts: AddPipelineOptions) => {
        await this.run(opts);
      });
  }

  async run(opts: unknown): Promise<void> {
    const options = opts as AddPipelineOptions;
    const { logger, spinner, prompter, fileWriter, providers, flags } = this.ctx;

    const detectedFramework = await this.detectFramework(flags.cwd);
    const detectedPm = await this.detectPackageManager(flags.cwd);

    const answers = await prompter.ask([
      {
        name: "provider",
        type: "list",
        message: "CI/CD provider:",
        choices: [
          { name: "GitHub Actions", value: "github" },
          { name: "Azure DevOps", value: "azure" },
          { name: "GitLab CI", value: "gitlab" },
        ],
        default: "github",
        when: () => !options.provider,
      },
      {
        name: "nodeVersion",
        type: "input",
        message: "Node version:",
        default: options.node ?? "20",
      },
      {
        name: "withDocker",
        type: "confirm",
        message: "Include Docker publish job?",
        default: false,
        when: () => !options.docker,
      },
      {
        name: "withRelease",
        type: "confirm",
        message: "Include release pipeline?",
        default: false,
        when: (a) => !options.release && a["provider"] === "github",
      },
    ]);

    const providerId = (options.provider ?? (answers["provider"] as ProviderId)) as ProviderId;
    const nodeVersion = (answers["nodeVersion"] as string) ?? options.node ?? "20";
    const withDocker = options.docker ?? (answers["withDocker"] as boolean) ?? false;
    const withRelease = options.release ?? (answers["withRelease"] as boolean) ?? false;

    spinner.start("Generating pipeline files");

    const provider = providers.resolve(providerId);
    const files = await provider.generate({
      projectName: detectedFramework.projectName,
      framework: detectedFramework.framework,
      packageManager: detectedPm,
      nodeVersion,
      withDocker,
      withRelease,
    });

    spinner.succeed("Pipeline files generated");

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

    logger.success("Pipeline added successfully.");
  }

  private async detectFramework(
    cwd: string,
  ): Promise<{ framework: FrameworkId | "generic"; projectName: string }> {
    try {
      const raw = await readFile(join(cwd, "package.json"), "utf-8");
      const pkg = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const framework: FrameworkId | "generic" = "@nestjs/core" in deps
        ? "nestjs"
        : "vue" in deps
          ? "vue"
          : "generic";
      return { framework, projectName: pkg.name ?? "app" };
    } catch {
      return { framework: "generic", projectName: "app" };
    }
  }

  private async detectPackageManager(cwd: string): Promise<PackageManager> {
    const { pathExists } = await import("fs-extra");
    if (await pathExists(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (await pathExists(join(cwd, "yarn.lock"))) return "yarn";
    return "npm";
  }
}
