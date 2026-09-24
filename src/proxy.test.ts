import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";
import { SESSION_COOKIE } from "./lib/session";

function request(pathname: string, cookie?: string): NextRequest {
  const headers = cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : undefined;
  return new NextRequest(new URL(pathname, "http://localhost:3001"), { headers });
}

describe("proxy", () => {
  it("deixa / passar com cookie (a página decide o destino pelo papel)", () => {
    const response = proxy(request("/", "token-valido"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona / para /login sem cookie", () => {
    const response = proxy(request("/"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("deixa /sessao-expirada passar mesmo sem cookie", () => {
    const response = proxy(request("/sessao-expirada"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("deixa /sessao-expirada passar mesmo com cookie", () => {
    const response = proxy(request("/sessao-expirada", "token-valido"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona /login para / quando já há cookie de sessão", () => {
    const response = proxy(request("/login", "token-valido"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/");
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
});
