import { beforeEach, describe, expect, it, vi } from "vitest";

function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (input: string) =>
    Buffer.from(input).toString("base64url");
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.assinatura-fake`;
}

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("./env", () => ({
  env: () => ({ API_BASE_URL: "http://api.test/api/v1", NODE_ENV: "test" }),
}));

import { SESSION_COOKIE, clearSession, getSessionToken, setSession, tokenMaxAge } from "./session";

describe("tokenMaxAge", () => {
  it("calcula o tempo restante a partir do exp do JWT", () => {
    const nowMs = 1_700_000_000_000;
    const token = fakeJwt({ exp: Math.floor(nowMs / 1000) + 3600 });

    expect(tokenMaxAge(token, nowMs)).toBe(3600);
  });

  it("usa o mínimo de 60s para token malformado", () => {
    expect(tokenMaxAge("token-invalido", Date.now())).toBe(60);
  });

  it("usa o mínimo de 60s quando o exp já passou", () => {
    const nowMs = 1_700_000_000_000;
    const token = fakeJwt({ exp: Math.floor(nowMs / 1000) - 1000 });

    expect(tokenMaxAge(token, nowMs)).toBe(60);
  });
});

describe("cookie de sessão", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("getSessionToken lê o cookie fs_cms_session", async () => {
    cookieStore.get.mockReturnValue({ value: "abc" });

    const token = await getSessionToken();

    expect(cookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(token).toBe("abc");
  });

  it("getSessionToken devolve null quando não há cookie", async () => {
    cookieStore.get.mockReturnValue(undefined);

    expect(await getSessionToken()).toBeNull();
  });

  it("setSession grava o cookie com as flags esperadas", async () => {
    const token = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

    await setSession(token);

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      token,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: expect.any(Number),
      }),
    );
  });

  it("clearSession apaga o cookie", async () => {
    await clearSession();

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});
