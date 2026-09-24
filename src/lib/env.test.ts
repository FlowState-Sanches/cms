import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("aceita uma URL válida e remove a barra final", () => {
    const env = parseEnv({
      API_BASE_URL: "http://localhost:3000/api/v1/",
      NODE_ENV: "test",
    });

    expect(env.API_BASE_URL).toBe("http://localhost:3000/api/v1");
    expect(env.NODE_ENV).toBe("test");
  });

  it("aplica development como padrão de NODE_ENV", () => {
    const env = parseEnv({ API_BASE_URL: "http://localhost:3000/api/v1" });

    expect(env.NODE_ENV).toBe("development");
  });

  it("rejeita API_BASE_URL ausente com mensagem clara", () => {
    expect(() => parseEnv({})).toThrowError(/API_BASE_URL/);
  });

  it("rejeita API_BASE_URL que não é uma URL", () => {
    expect(() => parseEnv({ API_BASE_URL: "não-é-url" })).toThrowError(
      /API_BASE_URL/,
    );
  });
});
