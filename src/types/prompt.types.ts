export type PackageManager = "npm" | "pnpm" | "yarn";
export type FrameworkId = "nestjs" | "vue";
export type ProviderId = "github" | "azure" | "gitlab";
export type GeneratorId = "nestjs" | "vue" | "dockerfile";

export interface PromptSchema {
  questions: PromptQuestion[];
}

export interface PromptQuestion {
  name: string;
  type: "input" | "list" | "confirm" | "checkbox";
  message: string;
  default?: unknown;
  choices?: Array<{ name: string; value: string }>;
  when?: (answers: Record<string, unknown>) => boolean;
}
