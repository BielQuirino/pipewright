import type { Command } from "commander";
import type { AppContext } from "../context/AppContext.js";

export abstract class BaseCommand {
  constructor(protected readonly ctxFactory: () => AppContext) {}

  abstract register(program: Command): void;
  abstract run(opts: unknown): Promise<void>;

  protected get ctx(): AppContext {
    return this.ctxFactory();
  }
}
