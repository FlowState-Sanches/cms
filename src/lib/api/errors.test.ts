import { describe, expect, it } from "vitest";
import { ApiError, messageFor } from "./errors";

describe("messageFor: códigos da gestão", () => {
  it.each([
    ["ACCOUNT_BLOCKED", "Conta bloqueada. Fale com o suporte FlowState."],
    ["CANNOT_TARGET_SELF", "Você não pode aplicar esta ação à sua própria conta."],
    [
      "ADMIN_BLOCK_FORBIDDEN",
      "Admins não podem ser bloqueados. Revogue o acesso de admin antes.",
    ],
    ["LAST_ADMIN", "Não é possível revogar o último admin do CMS."],
    ["ALREADY_ADMIN", "Esta conta já é admin."],
    ["USER_NOT_FOUND", "Conta não encontrada. Ela pode ter sido excluída."],
    ["NOT_A_PROFESSOR", "Esta conta não tem o papel de professor."],
    ["MEDIA_HAS_PAID_ORDERS", "Esta mídia tem pedido pago e não pode ser removida."],
    [
      "CALENDAR_RANGE_INVALID",
      "Período do calendário inválido. Escolha um mês válido.",
    ],
    ["USER_BLOCKED", "Conta bloqueada não pode virar admin. Desbloqueie antes."],
    ["MEDIA_NOT_FOUND", "Mídia não encontrada. Ela pode ter sido removida."],
  ])("traduz %s", (code, message) => {
    expect(messageFor(new ApiError(409, "english message", code))).toBe(message);
  });
});
