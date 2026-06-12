import type { FrameworkId, PackageManager, ProviderId, PromptSchema } from "./prompt.types.js";

export interface PipelineContext {
  framework: FrameworkId | "generic";
  packageManager: PackageManager;
  nodeVersion: string;
  withDocker: boolean;
  withRelease: boolean;
  projectName: string;
}

export interface EmittedFile {
  relativePath: string;
  contents: string;
}

export interface CiProvider {
  readonly id: ProviderId;
  readonly label: string;
  prompts(): PromptSchema;
  generate(ctx: PipelineContext): Promise<EmittedFile[]>;
}
