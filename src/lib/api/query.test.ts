import { describe, expect, it } from "vitest";
import { buildQuery } from "./query";

describe("buildQuery", () => {
  it("omite undefined e string vazia", () => {
    expect(buildQuery({ q: undefined, status: "", page: 2 })).toBe("?page=2");
  });

  it("serializa boolean e codifica caracteres especiais", () => {
    expect(buildQuery({ verified: false, q: "ana maria@x" })).toBe(
      "?verified=false&q=ana+maria%40x",
    );
  });

  it("devolve string vazia sem parâmetros", () => {
    expect(buildQuery({})).toBe("");
  });
});
