import type { CiProvider, PipelineContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { GITLAB_CONFIG } from "./gitlab.config.js";

export class GitlabCiProvider implements CiProvider {
  readonly id = GITLAB_CONFIG.id;
  readonly label = GITLAB_CONFIG.label;

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
    };

    return [
      {
        relativePath: GITLAB_CONFIG.outputFile,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${GITLAB_CONFIG.templateDir}/gitlab-ci.yml.ejs`),
          renderCtx,
        ),
      },
    ];
  }
}
