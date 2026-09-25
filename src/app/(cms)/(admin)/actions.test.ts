import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminApi: { setBlocked: vi.fn(), setProfessorVerified: vi.fn() },
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { ApiError } from "@/lib/api/errors";
import { setBlockedAction, setVerifiedAction } from "./actions";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setBlockedAction", () => {
  it("bloqueia e revalida lista, detalhe e painel", async () => {
    mocks.adminApi.setBlocked.mockResolvedValue({ id: ID, blocked: true });
    await expect(setBlockedAction("aluno", ID, true)).resolves.toEqual({ ok: true });
    expect(mocks.adminApi.setBlocked).toHaveBeenCalledWith(ID, true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/alunos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/alunos/${ID}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel");
  });

  it("desbloqueia um fotógrafo", async () => {
    mocks.adminApi.setBlocked.mockResolvedValue({ id: ID, blocked: false });
    await setBlockedAction("fotografo", ID, false);
    expect(mocks.adminApi.setBlocked).toHaveBeenCalledWith(ID, false);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/fotografos/${ID}`);
  });

  it.each([
    ["aluno", "../admins", true],
    ["admin", ID, true],
    ["aluno", ID, "sim"],
  ])("recusa entrada inválida (%s, %s, %s) sem chamar a API", async (kind, id, blocked) => {
    const result = await setBlockedAction(kind as never, id, blocked as never);
    expect(result).toEqual({
      ok: false,
      error: "Não foi possível concluir. Recarregue a página e tente de novo.",
    });
    expect(mocks.adminApi.setBlocked).not.toHaveBeenCalled();
  });

  it.each([
    ["ADMIN_BLOCK_FORBIDDEN", "Admins não podem ser bloqueados. Revogue o acesso de admin antes."],
    ["CANNOT_TARGET_SELF", "Você não pode aplicar esta ação à sua própria conta."],
  ])("traduz %s e não revalida", async (code, message) => {
    mocks.adminApi.setBlocked.mockRejectedValue(new ApiError(409, "x", code));
    await expect(setBlockedAction("professor", ID, true)).resolves.toEqual({
      ok: false,
      error: message,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("relança o redirect de sessão expirada", async () => {
    mocks.adminApi.setBlocked.mockRejectedValue(new Error("NEXT_REDIRECT:/sessao-expirada"));
    await expect(setBlockedAction("aluno", ID, true)).rejects.toThrow(
      "NEXT_REDIRECT:/sessao-expirada",
    );
  });
});

describe("setVerifiedAction", () => {
  it("verifica e revalida professores e painel", async () => {
    mocks.adminApi.setProfessorVerified.mockResolvedValue({});
    await expect(setVerifiedAction(ID, true)).resolves.toEqual({ ok: true });
    expect(mocks.adminApi.setProfessorVerified).toHaveBeenCalledWith(ID, true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/professores");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/professores/${ID}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel");
  });

  it("traduz NOT_A_PROFESSOR", async () => {
    mocks.adminApi.setProfessorVerified.mockRejectedValue(
      new ApiError(404, "x", "NOT_A_PROFESSOR"),
    );
    await expect(setVerifiedAction(ID, true)).resolves.toEqual({
      ok: false,
      error: "Esta conta não tem o papel de professor.",
    });
  });

  it("recusa id inválido", async () => {
    await expect(setVerifiedAction("x", true)).resolves.toMatchObject({ ok: false });
    expect(mocks.adminApi.setProfessorVerified).not.toHaveBeenCalled();
  });
});
