import type { CiProvider, ProviderId } from "../types/index.js";
import { UserError } from "../core/errors.js";

export class ProviderRegistry {
  private readonly map = new Map<ProviderId, CiProvider>();

  register(provider: CiProvider): void {
    this.map.set(provider.id, provider);
  }

  resolve(id: ProviderId): CiProvider {
    const provider = this.map.get(id);
    if (!provider) {
      throw new UserError(
        `Unknown provider: "${id}". Available: ${[...this.map.keys()].join(", ")}`,
      );
    }
    return provider;
  }

  list(): CiProvider[] {
    return [...this.map.values()];
  }
}
