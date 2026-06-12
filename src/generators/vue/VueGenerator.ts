import type { Generator, ScaffoldContext, EmittedFile, PromptSchema } from "../../types/index.js";
import type { TemplateEngine } from "../../core/TemplateEngine.js";
import type { PathResolver } from "../../core/PathResolver.js";
import { VUE_CONFIG } from "./vue.config.js";

export class VueGenerator implements Generator {
  readonly id = VUE_CONFIG.id;
  readonly label = VUE_CONFIG.label;

  constructor(
    private readonly engine: TemplateEngine,
    private readonly pathResolver: PathResolver,
  ) {}

  prompts(): PromptSchema {
    return {
      questions: [
        {
          name: "withTypeScript",
          type: "confirm",
          message: "Use TypeScript?",
          default: true,
        },
        {
          name: "withRouter",
          type: "confirm",
          message: "Include Vue Router?",
          default: true,
        },
        {
          name: "withPinia",
          type: "confirm",
          message: "Include Pinia (state management)?",
          default: true,
        },
      ],
    };
  }

  async generate(ctx: ScaffoldContext): Promise<EmittedFile[]> {
    const renderCtx = {
      projectName: ctx.projectName,
      packageManager: ctx.packageManager,
      withTypeScript: ctx["withTypeScript"] ?? true,
      withRouter: ctx["withRouter"] ?? true,
      withPinia: ctx["withPinia"] ?? true,
      port: VUE_CONFIG.defaultPort,
    };

    const tpl = (name: string): string =>
      this.pathResolver.templatePath(`${VUE_CONFIG.templateDir}/${name}`);

    const pairs: Array<[string, string]> = [
      ["package.json", "package.json.ejs"],
      ["tsconfig.json", "tsconfig.json.ejs"],
      ["tsconfig.app.json", "tsconfig.app.json.ejs"],
      ["tsconfig.node.json", "tsconfig.node.json.ejs"],
      ["vite.config.ts", "vite.config.ts.ejs"],
      ["index.html", "index.html.ejs"],
      [".gitignore", "gitignore.ejs"],
      ["src/main.ts", "src/main.ts.ejs"],
      ["src/App.vue", "src/App.vue.ejs"],
      ["src/env.d.ts", "src/env.d.ts.ejs"],
    ];

    return Promise.all(
      pairs.map(async ([out, tmpl]) => ({
        relativePath: out,
        contents: await this.engine.render(tpl(tmpl), renderCtx),
      })),
    );
  }
}
