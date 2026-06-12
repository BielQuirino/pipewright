import { Command } from "commander";
import { createRequire } from "module";
import { resolve } from "path";
import { AppContext } from "./context/AppContext.js";
import { registerCommands } from "./commands/index.js";
import { GithubActionsProvider } from "./providers/github/GithubActionsProvider.js";
import { AzureDevopsProvider } from "./providers/azure/AzureDevopsProvider.js";
import { GitlabCiProvider } from "./providers/gitlab/GitlabCiProvider.js";
import { NestjsGenerator } from "./generators/nestjs/NestjsGenerator.js";
import { VueGenerator } from "./generators/vue/VueGenerator.js";
import { DockerfileGenerator } from "./generators/dockerfile/DockerfileGenerator.js";
import { PipewrightError } from "./core/errors.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

const program = new Command();

program
  .name("pipewright")
  .description("Scaffold CI/CD pipelines and project boilerplates interactively")
  .version(pkg.version)
  .option("-c, --cwd <dir>", "Working directory", process.cwd())
  .option("-y, --yes", "Skip prompts, use defaults", false)
  .option("--dry-run", "Render but do not write files", false)
  .option("-F, --force", "Overwrite existing files", false)
  .option("--silent", "Suppress non-error output", false)
  .option("--no-spinner", "Disable spinners");

function buildContext(program: Command): AppContext {
  const opts = program.opts<{
    cwd: string;
    yes: boolean;
    dryRun: boolean;
    force: boolean;
    silent: boolean;
    spinner: boolean;
  }>();

  const ctx = new AppContext({
    cwd: resolve(opts.cwd),
    yes: opts.yes,
    dryRun: opts.dryRun,
    force: opts.force,
    silent: opts.silent,
    spinner: opts.spinner,
  });

  ctx.providers.register(new GithubActionsProvider(ctx.engine, ctx.pathResolver));
  ctx.providers.register(new AzureDevopsProvider(ctx.engine, ctx.pathResolver));
  ctx.providers.register(new GitlabCiProvider(ctx.engine, ctx.pathResolver));

  ctx.generators.register(new NestjsGenerator(ctx.engine, ctx.pathResolver));
  ctx.generators.register(new VueGenerator(ctx.engine, ctx.pathResolver));
  ctx.generators.register(new DockerfileGenerator(ctx.engine, ctx.pathResolver));

  return ctx;
}

registerCommands(program, () => buildContext(program));

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof PipewrightError) {
    process.stderr.write(`\n✖ ${err.message}\n`);
    process.exit("exitCode" in err ? (err as { exitCode: number }).exitCode : 1);
  }
  process.stderr.write(`\n✖ Unexpected error: ${String(err)}\n`);
  process.exit(2);
});
