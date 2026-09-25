import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { photographers: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));

import FotografosPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("FotografosPage", () => {
  it("lista com totais de sessões, fotos e vídeos", async () => {
    mocks.adminApi.photographers.mockResolvedValue({
      items: [
        {
          id: ID,
          name: "Carla Foto",
          email: "carla@x.test",
          blocked: false,
          sessionsCount: 4,
          photosCount: 1200,
          videosCount: 8,
          createdAt: "2026-09-01T12:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    render(await FotografosPage({ searchParams: Promise.resolve({ status: "ativo" }) }));

    expect(mocks.adminApi.photographers).toHaveBeenCalledWith({
      q: undefined,
      status: "active",
      page: 1,
      limit: 20,
    });
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Nome",
      "E-mail",
      "Sessões",
      "Fotos",
      "Vídeos",
      "Status",
      "Cadastro",
    ]);
    const table = screen.getByRole("table", { name: "Fotógrafos" });
    expect(within(table).getByText("1.200")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Carla Foto" })).toHaveAttribute(
      "href",
      `/fotografos/${ID}`,
    );
  });

  it("lista vazia mostra estado vazio", async () => {
    mocks.adminApi.photographers.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    render(await FotografosPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhum fotógrafo encontrado.")).toBeInTheDocument();
  });
});
