import { Command } from "commander";
import { join } from "path";
import chalk from "chalk";
import { BaseCommand } from "./Command.js";
import type { FrameworkId, GeneratorId, ProviderId, PackageManager } from "../types/index.js";
import { UserError } from "../core/errors.js";

interface InitOptions {
  framework?: FrameworkId;
  provider?: ProviderId;
  packageManager?: PackageManager;
  node?: string;
  docker?: boolean;
  release?: boolean;
  git?: boolean;
  install?: boolean;
  noPipeline?: boolean;
}

export class InitCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command("init [project-name]")
      .description("Scaffold a new project with CI/CD pipeline")
      .option("-f, --framework <framework>", "nestjs | vue")
      .option("-p, --provider <provider>", "github | azure | gitlab")
      .option("-m, --package-manager <pm>", "npm | pnpm | yarn", "npm")
      .option("--node <version>", "Node version for CI", "20")
      .option("--docker", "Include Dockerfile")
      .option("--release", "Include release pipeline")
      .option("--git", "Run git init after scaffold")
      .option("--install", "Run dependency install after scaffold")
      .option("--no-pipeline", "Skip CI/CD pipeline generation")
      .action(async (projectName: string | undefined, opts: InitOptions) => {
        await this.run({ projectName, ...opts });
      });
  }

  async run(opts: unknown): Promise<void> {
    const options = opts as { projectName?: string } & InitOptions;
    const { logger, spinner, prompter, fileWriter, providers, generators, flags } = this.ctx;

    const answers = await prompter.ask([
      {
        name: "projectName",
        type: "input",
        message: "Project name:",
        default: "my-app",
        when: () => !options.projectName,
      },
      {
        name: "framework",
        type: "list",
        message: "Framework:",
        choices: [
          { name: "NestJS", value: "nestjs" },
          { name: "Vue 3", value: "vue" },
        ],
        default: "nestjs",
        when: () => !options.framework,
      },
      {
        name: "packageManager",
        type: "list",
        message: "Package manager:",
        choices: [
          { name: "npm", value: "npm" },
          { name: "pnpm", value: "pnpm" },
          { name: "yarn", value: "yarn" },
        ],
        default: options.packageManager ?? "npm",
        when: () => !options.packageManager,
      },
      {
        name: "withPipeline",
        type: "confirm",
        message: "Add CI/CD pipeline?",
        default: true,
        when: () => !options.noPipeline,
      },
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
        when: (a) => !options.provider && (a["withPipeline"] as boolean) !== false,
      },
      {
        name: "nodeVersion",
        type: "input",
        message: "Node version for CI:",
        default: options.node ?? "20",
        when: (a) => (a["withPipeline"] as boolean) !== false,
      },
      {
        name: "withDocker",
        type: "confirm",
        message: "Include Dockerfile?",
        default: false,
        when: () => !options.docker,
      },
      {
        name: "withRelease",
        type: "confirm",
        message: "Include release pipeline?",
        default: false,
        when: (a) =>
          !options.release &&
          (a["withPipeline"] as boolean) !== false &&
          a["provider"] === "github",
      },
    ]);

    const projectName = (options.projectName ?? (answers["projectName"] as string)).trim();
    if (!projectName) throw new UserError("Project name cannot be empty.");

    const framework = (options.framework ?? (answers["framework"] as FrameworkId)) as FrameworkId;
    const packageManager = (options.packageManager ??
      (answers["packageManager"] as PackageManager)) as PackageManager;
    const nodeVersion = (answers["nodeVersion"] as string | undefined) ?? options.node ?? "20";
    const withDocker = options.docker ?? (answers["withDocker"] as boolean) ?? false;
    const withRelease = options.release ?? (answers["withRelease"] as boolean) ?? false;
    const withPipeline = !options.noPipeline && (answers["withPipeline"] as boolean) !== false;
    const providerId = (options.provider ??
      (answers["provider"] as ProviderId | undefined)) as ProviderId | undefined;

    const targetDir = join(flags.cwd, projectName);

    logger.blank();
    logger.info(`Scaffolding ${chalk.bold(projectName)} (${framework})`);
    logger.blank();

    spinner.start("Generating project files");

    const generator = generators.resolve(framework as GeneratorId);
    const generatorFiles = await generator.generate({
      projectName,
      targetDir,
      packageManager,
      description: "",
    });

    const allFiles = [...generatorFiles];

    if (withDocker) {
      const dockerGen = generators.resolve("dockerfile");
      const dockerFiles = await dockerGen.generate({
        projectName,
        targetDir,
        packageManager,
        framework,
      });
      allFiles.push(...dockerFiles);
    }

    if (withPipeline && providerId) {
      const provider = providers.resolve(providerId);
      const pipelineFiles = await provider.generate({
        projectName,
        framework,
        packageManager,
        nodeVersion,
        withDocker,
        withRelease,
      });
      allFiles.push(...pipelineFiles);
    }

    spinner.succeed("Files generated");

    const summary = await fileWriter.writeAll(allFiles, {
      targetDir,
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

    logger.success(`Project ${chalk.bold(projectName)} created at ${targetDir}`);
    logger.blank();
    logger.info(`Next steps:`);
    logger.info(`  cd ${projectName}`);

    logger.info(`  ${packageManager} install`);
  }
}
