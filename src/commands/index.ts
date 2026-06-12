import type { Command } from "commander";
import type { AppContext } from "../context/AppContext.js";
import { InitCommand } from "./InitCommand.js";
import { AddPipelineCommand } from "./AddPipelineCommand.js";
import { AddDockerfileCommand } from "./AddDockerfileCommand.js";

export function registerCommands(program: Command, ctxFactory: () => AppContext): void {
  new InitCommand(ctxFactory).register(program);
  new AddPipelineCommand(ctxFactory).register(program);
  new AddDockerfileCommand(ctxFactory).register(program);
}
