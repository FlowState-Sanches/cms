import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";
import { SESSION_COOKIE } from "./lib/session";

function request(pathname: string, cookie?: string): NextRequest {
  const headers = cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : undefined;
  return new NextRequest(new URL(pathname, "http://localhost:3001"), { headers });
}

describe("proxy", () => {
  it("redireciona / para /treinos", () => {
    const response = proxy(request("/"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/treinos");
  });

  it("deixa /sessao-expirada passar mesmo sem cookie", () => {
    const response = proxy(request("/sessao-expirada"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("deixa /sessao-expirada passar mesmo com cookie", () => {
    const response = proxy(request("/sessao-expirada", "token-valido"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona /login para /treinos quando já há cookie de sessão", () => {
    const response = proxy(request("/login", "token-valido"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/treinos");
  });

  it("deixa /login passar sem cookie", () => {
    const response = proxy(request("/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona qualquer outra rota para /login quando não há cookie", () => {
    const response = proxy(request("/treinos"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("deixa passar quando há cookie de sessão", () => {
    const response = proxy(request("/treinos", "token-valido"));
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/favicon.ico", "/icon.svg?icon.abc.svg", "/apple-icon.png?apple-icon.abc.png"])(
    "não intercepta o ícone %s (a tela de login também precisa dele)",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    },
  );

  it("continua interceptando as rotas do CMS", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "/treinos" })).toBe(true);
  });
});
