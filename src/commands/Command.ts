import type { Command } from "commander";
import type { AppContext } from "../context/AppContext.js";

export abstract class BaseCommand {
  private _ctx: AppContext | undefined;

  constructor(protected readonly ctxFactory: () => AppContext) {}

  abstract register(program: Command): void;
  abstract run(opts: unknown): Promise<void>;

  protected get ctx(): AppContext {
    return (this._ctx ??= this.ctxFactory());
  }
}
