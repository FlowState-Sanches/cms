import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminApi: { removeMedia: vi.fn() },
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { ApiError } from "@/lib/api/errors";
import { removeMediaAction } from "./actions";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("removeMediaAction", () => {
  it("remove, revalida e volta para a grade com aviso", async () => {
    mocks.adminApi.removeMedia.mockResolvedValue(undefined);
    await expect(removeMediaAction(ID)).rejects.toThrow("NEXT_REDIRECT:/midias?removida=1");
    expect(mocks.adminApi.removeMedia).toHaveBeenCalledWith(ID);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/midias");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel");
  });

  it("MEDIA_HAS_PAID_ORDERS é recusado sem redirecionar", async () => {
    mocks.adminApi.removeMedia.mockRejectedValue(
      new ApiError(409, "x", "MEDIA_HAS_PAID_ORDERS"),
    );
    await expect(removeMediaAction(ID)).resolves.toEqual({
      ok: false,
      error: "Esta mídia tem pedido pago e não pode ser removida.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("id inválido não chama a API", async () => {
    await expect(removeMediaAction("../x")).resolves.toMatchObject({ ok: false });
    expect(mocks.adminApi.removeMedia).not.toHaveBeenCalled();
  });
});
