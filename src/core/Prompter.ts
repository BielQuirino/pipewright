import { confirm, input, select, checkbox } from "@inquirer/prompts";
import type { PromptQuestion } from "../types/index.js";

export class Prompter {
  constructor(private readonly acceptDefaults: boolean) {}

  async ask(questions: PromptQuestion[]): Promise<Record<string, unknown>> {
    const answers: Record<string, unknown> = {};

    for (const question of questions) {
      if (question.when && !question.when(answers)) {
        continue;
      }

      if (this.acceptDefaults && question.default !== undefined) {
        answers[question.name] = question.default;
        continue;
      }

      answers[question.name] = await this.prompt(question, answers);
    }

    return answers;
  }

  private async prompt(
    question: PromptQuestion,
    _answers: Record<string, unknown>,
  ): Promise<unknown> {
    switch (question.type) {
      case "input":
        return input({ message: question.message, default: question.default as string });

      case "confirm":
        return confirm({ message: question.message, default: question.default as boolean });

      case "list":
        return select({
          message: question.message,
          choices: (question.choices ?? []).map((c) => ({ name: c.name, value: c.value })),
          default: question.default as string,
        });

      case "checkbox":
        return checkbox({
          message: question.message,
          choices: (question.choices ?? []).map((c) => ({ name: c.name, value: c.value })),
        });
    }
  }
}
