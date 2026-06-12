import type { CiProvider, PipelineContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { GITHUB_CONFIG } from "./github.config.js";

export class GithubActionsProvider implements CiProvider {
  readonly id = GITHUB_CONFIG.id;
  readonly label = GITHUB_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return { questions: [] };
  }

  async generate(ctx: PipelineContext): Promise<EmittedFile[]> {
    const renderCtx = {
      projectName: ctx.projectName,
      nodeVersion: ctx.nodeVersion,
      packageManager: ctx.packageManager,
      withDocker: ctx.withDocker,
      withRelease: ctx.withRelease,
      framework: ctx.framework,
    };

    const files: EmittedFile[] = [
      {
        relativePath: `${GITHUB_CONFIG.outputDir}/ci.yml`,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${GITHUB_CONFIG.templateDir}/node-ci.yml.ejs`),
          renderCtx,
        ),
      },
    ];

    if (ctx.withDocker) {
      files.push({
        relativePath: `${GITHUB_CONFIG.outputDir}/docker-publish.yml`,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${GITHUB_CONFIG.templateDir}/docker-publish.yml.ejs`),
          renderCtx,
        ),
      });
    }

    if (ctx.withRelease) {
      files.push({
        relativePath: `${GITHUB_CONFIG.outputDir}/release.yml`,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${GITHUB_CONFIG.templateDir}/release.yml.ejs`),
          renderCtx,
        ),
      });
    }

    return files;
  }
}
