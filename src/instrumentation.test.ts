import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("register (validação do ambiente no boot)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falha ao subir o servidor Node sem API_BASE_URL", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("API_BASE_URL", "");
    const { register } = await import("./instrumentation");

    await expect(register()).rejects.toThrow(/API_BASE_URL/);
  });

  it("sobe normalmente com API_BASE_URL válida", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("API_BASE_URL", "http://localhost:3000/api/v1");
    const { register } = await import("./instrumentation");

    await expect(register()).resolves.toBeUndefined();
  });

  it("não valida fora do runtime Node (edge)", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("API_BASE_URL", "");
    const { register } = await import("./instrumentation");

    await expect(register()).resolves.toBeUndefined();
  });
});
