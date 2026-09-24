import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), pillars: vi.fn() }));
vi.mock("./client", () => ({
  cmsApi: { access: mocks.access, pillars: mocks.pillars },
}));

import { isCurator } from "./cached";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isCurator", () => {
  it("true só para quem tem canCurate", async () => {
    mocks.access.mockResolvedValueOnce({
      canEdit: true,
      canCurate: true,
      user: { id: "a", name: "Admin" },
    });
    await expect(isCurator()).resolves.toBe(true);

    mocks.access.mockResolvedValueOnce({
      canEdit: true,
      canCurate: false,
      user: { id: "p", name: "Prof" },
    });
    await expect(isCurator()).resolves.toBe(false);
  });
});
