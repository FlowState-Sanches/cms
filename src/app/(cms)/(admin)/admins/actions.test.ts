import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminApi: { grantAdmin: vi.fn(), revokeAdmin: vi.fn() },
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { ApiError } from "@/lib/api/errors";
import { grantAdminAction, revokeAdminAction } from "./actions";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

function form(email: string): FormData {
  const data = new FormData();
  data.set("email", email);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("grantAdminAction", () => {
  it("apara e normaliza o e-mail, concede e revalida", async () => {
    mocks.adminApi.grantAdmin.mockResolvedValue({ id: ID, name: "Nova Pessoa", email: "nova@x.test" });
    await expect(grantAdminAction(null, form("  Nova@X.test "))).resolves.toEqual({
      ok: true,
      message: "Nova Pessoa agora é admin.",
    });
    expect(mocks.adminApi.grantAdmin).toHaveBeenCalledWith("nova@x.test");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admins");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel");
  });

  it("e-mail inválido volta como erro de campo sem chamar a API", async () => {
    await expect(grantAdminAction(null, form("nao-e-email"))).resolves.toEqual({
      ok: false,
      error: "Informe um e-mail válido.",
      email: "nao-e-email",
      fieldError: "Informe um e-mail válido.",
    });
    expect(mocks.adminApi.grantAdmin).not.toHaveBeenCalled();
  });

  it("USER_NOT_FOUND vira erro no campo de e-mail", async () => {
    mocks.adminApi.grantAdmin.mockRejectedValue(new ApiError(404, "x", "USER_NOT_FOUND"));
    await expect(grantAdminAction(null, form("ninguem@x.test"))).resolves.toEqual({
      ok: false,
      error: "Nenhuma conta encontrada com esse e-mail.",
      email: "ninguem@x.test",
      fieldError: "Nenhuma conta encontrada com esse e-mail.",
    });
  });

  it("ALREADY_ADMIN vira erro no campo de e-mail", async () => {
    mocks.adminApi.grantAdmin.mockRejectedValue(new ApiError(409, "x", "ALREADY_ADMIN"));
    await expect(grantAdminAction(null, form("adm@x.test"))).resolves.toMatchObject({
      ok: false,
      fieldError: "Esta conta já é admin.",
    });
  });

  it("USER_BLOCKED (conta bloqueada) vira erro no campo de e-mail", async () => {
    mocks.adminApi.grantAdmin.mockRejectedValue(new ApiError(409, "x", "USER_BLOCKED"));
    await expect(grantAdminAction(null, form("bloq@x.test"))).resolves.toMatchObject({
      ok: false,
      fieldError: "Conta bloqueada não pode virar admin. Desbloqueie antes.",
    });
  });

  it("403 sem code vira erro geral", async () => {
    mocks.adminApi.grantAdmin.mockRejectedValue(new ApiError(403, "Forbidden", null));
    const result = await grantAdminAction(null, form("adm@x.test"));
    expect(result).toEqual({
      ok: false,
      error: "Sua conta não tem permissão para esta ação.",
      email: "adm@x.test",
    });
  });
});

describe("revokeAdminAction", () => {
  it("revoga e revalida", async () => {
    mocks.adminApi.revokeAdmin.mockResolvedValue(undefined);
    await expect(revokeAdminAction(ID)).resolves.toEqual({ ok: true });
    expect(mocks.adminApi.revokeAdmin).toHaveBeenCalledWith(ID);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admins");
  });

  it.each([
    ["LAST_ADMIN", "Não é possível revogar o último admin do CMS."],
    ["CANNOT_TARGET_SELF", "Você não pode aplicar esta ação à sua própria conta."],
  ])("traduz %s", async (code, message) => {
    mocks.adminApi.revokeAdmin.mockRejectedValue(new ApiError(409, "x", code));
    await expect(revokeAdminAction(ID)).resolves.toEqual({ ok: false, error: message });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("id inválido não chama a API", async () => {
    await expect(revokeAdminAction("x")).resolves.toMatchObject({ ok: false });
    expect(mocks.adminApi.revokeAdmin).not.toHaveBeenCalled();
  });
});
