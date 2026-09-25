import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  getAccess: vi.fn(),
  adminApi: { admins: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator, getAccess: mocks.getAccess }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));
vi.mock("@/app/(cms)/(admin)/admins/actions", () => ({
  grantAdminAction: vi.fn(),
  revokeAdminAction: vi.fn(),
}));

import AdminsPage from "./page";

const ME = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const OTHER = "2b1c3d4e-5f60-4718-9a2b-3c4d5e6f7a8b";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
  mocks.getAccess.mockResolvedValue({ canEdit: true, canCurate: true, user: { id: ME, name: "Eu" } });
});

describe("AdminsPage", () => {
  it("lista admins, marca a própria conta e oferece Revogar em cada linha", async () => {
    mocks.adminApi.admins.mockResolvedValue({
      items: [
        { id: ME, name: "Eu", email: "eu@x.test", since: "2026-09-01T00:00:00.000Z" },
        { id: OTHER, name: "Outra", email: "outra@x.test" },
      ],
    });
    render(await AdminsPage());

    expect(screen.getByRole("heading", { level: 1, name: "Admins" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail da conta")).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Admins do CMS" });
    const mine = within(table).getByRole("row", { name: /eu@x\.test/ });
    expect(mine).toHaveTextContent("(você)");
    // 2026-09-01T00:00:00Z é 2026-08-31 21:00 em São Paulo (UTC-3, H6).
    expect(mine).toHaveTextContent("31/08/2026 21:00");
    const other = within(table).getByRole("row", { name: /outra@x\.test/ });
    expect(other).toHaveTextContent("Sem registro");
    expect(within(other).getByRole("button", { name: "Revogar" })).toBeInTheDocument();
  });

  it("no celular cada admin vira um cartão com Revogar", async () => {
    mocks.adminApi.admins.mockResolvedValue({
      items: [
        { id: ME, name: "Eu", email: "eu@x.test", since: "2026-09-01T00:00:00.000Z" },
        { id: OTHER, name: "Outra", email: "outra@x.test" },
      ],
    });
    render(await AdminsPage());

    const list = screen.getByRole("list", { name: "Admins do CMS" });
    const [mine, other] = within(list).getAllByRole("listitem");
    expect(mine).toHaveTextContent("(você)");
    expect(within(other!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "E-mail",
      "Admin desde",
      "Ações",
    ]);
    expect(within(other!).getByRole("button", { name: "Revogar" })).toBeInTheDocument();
  });

  it("sem curadoria não chama a API", async () => {
    mocks.isCurator.mockResolvedValue(false);
    expect(await AdminsPage()).toBeNull();
    expect(mocks.adminApi.admins).not.toHaveBeenCalled();
  });
});
