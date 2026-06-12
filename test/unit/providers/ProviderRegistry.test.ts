import { describe, it, expect } from "vitest";
import { ProviderRegistry } from "../../../src/providers/ProviderRegistry.js";
import { UserError } from "../../../src/core/errors.js";
import type { CiProvider } from "../../../src/types/index.js";

const makeProvider = (id: "github" | "azure" | "gitlab"): CiProvider => ({
  id,
  label: id,
  prompts: () => ({ questions: [] }),
  generate: async () => [],
});

describe("ProviderRegistry", () => {
  it("resolves a registered provider", () => {
    const registry = new ProviderRegistry();
    registry.register(makeProvider("github"));
    expect(registry.resolve("github").id).toBe("github");
  });

  it("throws UserError for unknown provider", () => {
    const registry = new ProviderRegistry();
    expect(() => registry.resolve("azure")).toThrow(UserError);
  });

  it("lists all registered providers", () => {
    const registry = new ProviderRegistry();
    registry.register(makeProvider("github"));
    registry.register(makeProvider("azure"));
    expect(registry.list()).toHaveLength(2);
  });
});
