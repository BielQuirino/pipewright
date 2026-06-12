import type { CiProvider, PipelineContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { AZURE_CONFIG } from "./azure.config.js";

export class AzureDevopsProvider implements CiProvider {
  readonly id = AZURE_CONFIG.id;
  readonly label = AZURE_CONFIG.label;

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
        relativePath: AZURE_CONFIG.outputFile,
        contents: await this.engine.render(
          this.pathResolver.templatePath(`${AZURE_CONFIG.templateDir}/azure-pipelines.yml.ejs`),
          renderCtx,
        ),
      },
    ];
  }
}
