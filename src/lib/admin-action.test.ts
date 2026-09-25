import { describe, expect, it } from "vitest";
import { ApiError } from "./api/errors";
import { adminFailure, entityIdSchema } from "./admin-action";

describe("adminFailure", () => {
  it("traduz o code da API", () => {
    expect(adminFailure(new ApiError(409, "x", "LAST_ADMIN"))).toEqual({
      ok: false,
      error: "Não é possível revogar o último admin do CMS.",
    });
  });

  it("403 sem code (CmsAdminGuard) vira falta de permissão", () => {
    expect(adminFailure(new ApiError(403, "Forbidden resource", null))).toEqual({
      ok: false,
      error: "Sua conta não tem permissão para esta ação.",
    });
  });

  it("400 sem code (ValidationPipe, em inglês) vira mensagem geral", () => {
    expect(adminFailure(new ApiError(400, "id must be a UUID", null))).toEqual({
      ok: false,
      error: "A API recusou os dados enviados. Recarregue a página e tente de novo.",
    });
  });

  it("relança o que não é ApiError", () => {
    const redirect = new Error("NEXT_REDIRECT:/sessao-expirada");
    expect(() => adminFailure(redirect)).toThrow(redirect);
  });
});

describe("entityIdSchema", () => {
  it("aceita uuid e recusa caminho", () => {
    expect(entityIdSchema.safeParse("7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f").success).toBe(true);
    expect(entityIdSchema.safeParse("../admins").success).toBe(false);
  });
});
