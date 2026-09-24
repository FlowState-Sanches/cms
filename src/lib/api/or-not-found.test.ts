import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import { ApiError } from "./errors";
import { orNotFound } from "./or-not-found";

describe("orNotFound", () => {
  it("devolve o valor carregado", async () => {
    await expect(orNotFound(async () => 42)).resolves.toBe(42);
  });

  it("404 da API vira notFound()", async () => {
    await expect(
      orNotFound(async () => {
        throw new ApiError(404, "not found", "USER_NOT_FOUND");
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("outros erros sobem intactos (inclusive o redirect de 401)", async () => {
    const redirect = new Error("NEXT_REDIRECT:/sessao-expirada");
    await expect(
      orNotFound(async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
    await expect(
      orNotFound(async () => {
        throw new ApiError(403, "Forbidden", null);
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
