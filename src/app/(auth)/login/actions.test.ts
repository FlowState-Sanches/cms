import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/api/client", () => ({ apiRequest: mocks.apiRequest }));
vi.mock("@/lib/session", () => ({
  setSession: mocks.setSession,
  clearSession: mocks.clearSession,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { ApiError } from "@/lib/api/errors";
import { loginAction } from "./actions";

function form(email = "prof@flowstate.dev", password = "Senha123!") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

const loginOk = { accessToken: "token", user: { id: "u1", name: "Prof" } };
const accessOk = {
  canEdit: true,
  canCurate: false,
  user: { id: "u1", name: "Prof" },
};

describe("loginAction", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("entra e redireciona para /treinos quando a conta pode editar", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce(loginOk)
      .mockResolvedValueOnce(accessOk);

    await expect(loginAction(null, form())).rejects.toThrow(
      "NEXT_REDIRECT:/treinos",
    );
    expect(mocks.setSession).toHaveBeenCalledWith("token");
  });

  it("401 no login vira mensagem de credenciais", async () => {
    mocks.apiRequest.mockRejectedValueOnce(
      new ApiError(401, "Credenciais inválidas", null),
    );

    await expect(loginAction(null, form())).resolves.toEqual({
      error: "E-mail ou senha incorretos.",
    });
  });

  it("conta sem canEdit apaga a sessão e explica o motivo", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce(loginOk)
      .mockResolvedValueOnce({ ...accessOk, canEdit: false });

    const result = await loginAction(null, form());

    expect(result?.error).toMatch(/não tem acesso ao CMS/);
    expect(mocks.clearSession).toHaveBeenCalled();
  });

  it("erro que não vem da API no login (ex.: API_BASE_URL ausente) é registrado e propagado", async () => {
    const configError = new Error(
      "Configuração inválida: API_BASE_URL: Required",
    );
    mocks.apiRequest.mockRejectedValueOnce(configError);

    await expect(loginAction(null, form())).rejects.toBe(configError);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("[login]"),
      configError,
    );
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it("erro que não vem da API na checagem de acesso apaga a sessão e é propagado", async () => {
    const unexpected = new Error("Resposta inesperada da API");
    mocks.apiRequest
      .mockResolvedValueOnce(loginOk)
      .mockRejectedValueOnce(unexpected);

    await expect(loginAction(null, form())).rejects.toBe(unexpected);
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("[login]"),
      unexpected,
    );
  });

  it("erro da API na checagem de acesso continua virando mensagem", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce(loginOk)
      .mockRejectedValueOnce(new ApiError(503, "Serviço indisponível", null));

    const result = await loginAction(null, form());

    expect(result).toEqual({ error: "Serviço indisponível" });
    expect(mocks.clearSession).toHaveBeenCalled();
  });
});
