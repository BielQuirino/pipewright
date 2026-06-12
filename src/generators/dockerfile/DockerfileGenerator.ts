import type { Generator, ScaffoldContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { DOCKERFILE_CONFIG } from "./dockerfile.config.js";

export class DockerfileGenerator implements Generator {
  readonly id = DOCKERFILE_CONFIG.id;
  readonly label = DOCKERFILE_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return {
      questions: [
        {
          name: "nodeVersion",
          type: "input",
          message: "Node version for base image:",
          default: "20",
        },
        {
          name: "port",
          type: "input",
          message: "Exposed port:",
          default: "3000",
        },
      ],
    };
  }

  async generate(ctx: ScaffoldContext): Promise<EmittedFile[]> {
    const framework = (ctx["framework"] as string) ?? "nestjs";
    const nodeVersion = (ctx["nodeVersion"] as string) ?? "20";
    const port = (ctx["port"] as string) ?? "3000";

    const templateFile = framework === "vue" ? "vue.Dockerfile.ejs" : "nestjs.Dockerfile.ejs";

    const renderCtx = {
      nodeVersion,
      port,
      projectName: ctx.projectName,
      packageManager: ctx.packageManager,
    };

    const tpl = (name: string): string =>
      this.pathResolver.templatePath(`${DOCKERFILE_CONFIG.templateDir}/${name}`);

    return [
      {
        relativePath: "Dockerfile",
        contents: await this.engine.render(tpl(templateFile), renderCtx),
      },
      {
        relativePath: ".dockerignore",
        contents: await this.engine.render(tpl("dockerignore.ejs"), renderCtx),
      },
    ];
  }
}
