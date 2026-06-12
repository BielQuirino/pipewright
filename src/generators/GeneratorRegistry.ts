import type { Generator, GeneratorId } from "../types/index.js";
import { UserError } from "../core/errors.js";

export class GeneratorRegistry {
  private readonly map = new Map<GeneratorId, Generator>();

  register(generator: Generator): void {
    this.map.set(generator.id, generator);
  }

  resolve(id: GeneratorId): Generator {
    const generator = this.map.get(id);
    if (!generator) {
      throw new UserError(
        `Unknown generator: "${id}". Available: ${[...this.map.keys()].join(", ")}`,
      );
    }
    return generator;
  }

  list(): Generator[] {
    return [...this.map.values()];
  }
}
