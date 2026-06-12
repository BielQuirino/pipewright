import type { GlobalFlags } from "../types/index.js";
import { Logger } from "../core/Logger.js";
import { Spinner } from "../core/Spinner.js";
import { Prompter } from "../core/Prompter.js";
import { FileWriter } from "../core/FileWriter.js";
import { TemplateEngine } from "../core/TemplateEngine.js";
import { PathResolver } from "../core/PathResolver.js";
import { ProviderRegistry } from "../providers/ProviderRegistry.js";
import { GeneratorRegistry } from "../generators/GeneratorRegistry.js";

export class AppContext {
  readonly logger: Logger;
  readonly spinner: Spinner;
  readonly prompter: Prompter;
  readonly fileWriter: FileWriter;
  readonly engine: TemplateEngine;
  readonly pathResolver: PathResolver;
  readonly providers: ProviderRegistry;
  readonly generators: GeneratorRegistry;
  readonly flags: GlobalFlags;

  constructor(flags: GlobalFlags) {
    this.flags = flags;
    this.logger = new Logger(flags.silent);
    this.spinner = new Spinner(flags.spinner);
    this.prompter = new Prompter(flags.yes);
    this.fileWriter = new FileWriter();
    this.engine = new TemplateEngine();
    this.pathResolver = new PathResolver();
    this.providers = new ProviderRegistry();
    this.generators = new GeneratorRegistry();
  }
}
