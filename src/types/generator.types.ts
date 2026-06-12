import type { GeneratorId, PackageManager, PromptSchema } from "./prompt.types.js";
import type { EmittedFile } from "./provider.types.js";

export interface ScaffoldContext {
  projectName: string;
  targetDir: string;
  packageManager: PackageManager;
  [key: string]: unknown;
}

export interface Generator {
  readonly id: GeneratorId;
  readonly label: string;
  prompts(): PromptSchema;
  generate(ctx: ScaffoldContext): Promise<EmittedFile[]>;
}
