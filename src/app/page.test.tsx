import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccess: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/api/cached", () => ({ getAccess: mocks.getAccess }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import Home from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Home (/)", () => {
  it("admin vai para /painel", async () => {
    mocks.getAccess.mockResolvedValue({
      canEdit: true,
      canCurate: true,
      user: { id: "a", name: "Admin" },
    });
    await expect(Home()).rejects.toThrow("NEXT_REDIRECT:/painel");
  });

  it("professor vai para /treinos", async () => {
    mocks.getAccess.mockResolvedValue({
      canEdit: true,
      canCurate: false,
      user: { id: "p", name: "Prof" },
    });
    await expect(Home()).rejects.toThrow("NEXT_REDIRECT:/treinos");
  });
});
