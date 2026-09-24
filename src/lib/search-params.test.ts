import { describe, expect, it } from "vitest";
import {
  firstParam,
  hrefWith,
  parseOption,
  parsePage,
  parseSearch,
} from "./search-params";

describe("search-params", () => {
  it("firstParam pega o primeiro valor de parâmetro repetido", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("a")).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
  });

  it.each([
    [undefined, 1],
    ["", 1],
    ["abc", 1],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    ["3", 3],
  ])("parsePage(%s) = %s", (value, expected) => {
    expect(parsePage(value)).toBe(expected);
  });

  it("parseSearch apara, descarta vazio e limita a 100 caracteres", () => {
    expect(parseSearch("  ana  ")).toBe("ana");
    expect(parseSearch("   ")).toBeUndefined();
    expect(parseSearch("x".repeat(150))).toHaveLength(100);
  });

  it("parseOption só aceita chave própria do mapa", () => {
    const map = { ativo: "active", bloqueado: "blocked" } as const;
    expect(parseOption("bloqueado", map)).toBe("blocked");
    expect(parseOption("talvez", map)).toBeUndefined();
    expect(parseOption("constructor", map)).toBeUndefined();
    expect(parseOption(undefined, map)).toBeUndefined();
  });

  it("hrefWith omite vazio e página 1", () => {
    expect(hrefWith("/alunos", { q: "ana", status: undefined, pagina: 1 })).toBe(
      "/alunos?q=ana",
    );
    expect(hrefWith("/alunos", { q: "", pagina: 3 })).toBe("/alunos?pagina=3");
    expect(hrefWith("/alunos", {})).toBe("/alunos");
  });
});
