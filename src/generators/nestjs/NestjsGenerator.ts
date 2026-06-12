import type { Generator, ScaffoldContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { NESTJS_CONFIG } from "./nestjs.config.js";

export class NestjsGenerator implements Generator {
  readonly id = NESTJS_CONFIG.id;
  readonly label = NESTJS_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return {
      questions: [
        {
          name: "description",
          type: "input",
          message: "Project description:",
          default: "",
        },
      ],
    };
  }

  async generate(ctx: ScaffoldContext): Promise<EmittedFile[]> {
    const renderCtx = {
      projectName: ctx.projectName,
      packageManager: ctx.packageManager,
      description: ctx["description"] ?? "",
      port: NESTJS_CONFIG.defaultPort,
    };

    const tpl = (name: string): string =>
      this.pathResolver.templatePath(`${NESTJS_CONFIG.templateDir}/${name}`);

    const pairs: Array<[string, string]> = [
      ["package.json", "package.json.ejs"],
      ["tsconfig.json", "tsconfig.json.ejs"],
      ["tsconfig.build.json", "tsconfig.build.json.ejs"],
      ["nest-cli.json", "nest-cli.json.ejs"],
      [".gitignore", "gitignore.ejs"],
      [".eslintrc.js", "eslintrc.js.ejs"],
      [".prettierrc", "prettierrc.ejs"],
      ["src/main.ts", "src/main.ts.ejs"],
      ["src/app.module.ts", "src/app.module.ts.ejs"],
      ["src/app.controller.ts", "src/app.controller.ts.ejs"],
      ["src/app.service.ts", "src/app.service.ts.ejs"],
      ["src/app.controller.spec.ts", "src/app.controller.spec.ts.ejs"],
      ["test/app.e2e-spec.ts", "test/app.e2e-spec.ts.ejs"],
      ["test/jest-e2e.json", "test/jest-e2e.json.ejs"],
    ];

    return Promise.all(
      pairs.map(async ([out, tmpl]) => ({
        relativePath: out,
        contents: await this.engine.render(tpl(tmpl), renderCtx),
      })),
    );
  }
}
