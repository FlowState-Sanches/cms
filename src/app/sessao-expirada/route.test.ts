import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/session";
import { GET } from "./route";

describe("GET /sessao-expirada", () => {
  it("apaga o cookie de sessão e redireciona para /login?expirada=1", async () => {
    const request = new NextRequest(new URL("/sessao-expirada", "http://localhost:3001"), {
      headers: { cookie: `${SESSION_COOKIE}=token-expirado` },
    });

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3001/login?expirada=1",
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE}=;`);
  });
});
