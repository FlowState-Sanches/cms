import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { redirectMock, getSessionTokenMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getSessionTokenMock: vi.fn<() => Promise<string | null>>(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("../session", () => ({
  getSessionToken: getSessionTokenMock,
}));

vi.mock("../env", () => ({
  env: () => ({
    API_BASE_URL: "http://api.test/api/v1",
    NODE_ENV: "test",
  }),
}));

import { apiRequest, authedRequest } from "./client";
import { ApiError, messageFor } from "./errors";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    redirectMock.mockClear();
    getSessionTokenMock.mockReset();
  });

  it("envia Authorization e Content-Type quando há token e body", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiRequest("/ping", z.object({ ok: z.boolean() }), {
      method: "POST",
      body: { a: 1 },
      token: "meu-token",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://api.test/api/v1/ping");
    expect(requestInit).toMatchObject({
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      cache: "no-store",
    });
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer meu-token");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("converte resposta de erro com code em ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(409, { statusCode: 409, message: "Código em uso", code: "CODE_TAKEN" }),
    );

    await expect(apiRequest("/treinos", z.unknown())).rejects.toMatchObject({
      status: 409,
      code: "CODE_TAKEN",
      message: "Código em uso",
    });
  });

  it("devolve undefined em respostas 204", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest("/treinos/1", z.void());

    expect(result).toBeUndefined();
  });

  it("lança erro quando a resposta não bate com o schema esperado", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, { unexpected: true }));

    await expect(apiRequest("/treinos", z.object({ id: z.string() }))).rejects.toThrow(
      "Resposta inesperada da API",
    );
  });
});

describe("messageFor", () => {
  it("traduz SELF_ASSESSMENT_LOCKED", () => {
    const error = new ApiError(409, "conflict", "SELF_ASSESSMENT_LOCKED");
    expect(messageFor(error)).toBe(
      "Não é possível alterar a autoavaliação: já há alunos com essa etapa concluída.",
    );
  });

  it("usa a mensagem padrão para erros desconhecidos", () => {
    expect(messageFor(new Error("boom"))).toBe("Não foi possível concluir. Tente de novo.");
  });
});

describe("authedRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    redirectMock.mockClear();
    getSessionTokenMock.mockReset();
  });

  it("em 401 redireciona para /sessao-expirada sem mexer em cookies", async () => {
    getSessionTokenMock.mockResolvedValue("token-expirado");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(401, { statusCode: 401, message: "Unauthorized" }),
    );

    await expect(authedRequest("/cms/trilha/acesso", z.unknown())).rejects.toThrow(
      "NEXT_REDIRECT:/sessao-expirada",
    );

    expect(redirectMock).toHaveBeenCalledWith("/sessao-expirada");
  });

  it("repassa outros erros sem redirecionar", async () => {
    getSessionTokenMock.mockResolvedValue("token-valido");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(403, { statusCode: 403, message: "Acesso restrito ao CMS da Trilha" }),
    );

    await expect(authedRequest("/cms/trilha/acesso", z.unknown())).rejects.toMatchObject({
      status: 403,
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
