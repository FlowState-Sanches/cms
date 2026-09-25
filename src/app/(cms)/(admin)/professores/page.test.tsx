import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { professors: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));

import ProfessoresPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const item = {
  id: ID,
  name: "Ana Prof",
  email: "ana@x.test",
  verified: false,
  blocked: false,
  lessonsCount: 12,
  createdAt: "2026-09-01T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("ProfessoresPage", () => {
  it("traduz os filtros da URL para a API e os preserva na paginação", async () => {
    mocks.adminApi.professors.mockResolvedValue({ items: [item], total: 45, page: 2, limit: 20 });
    render(
      await ProfessoresPage({
        searchParams: Promise.resolve({
          q: " ana ",
          verificacao: "pendente",
          status: "bloqueado",
          pagina: "2",
        }),
      }),
    );

    expect(mocks.adminApi.professors).toHaveBeenCalledWith({
      q: "ana",
      verified: false,
      status: "blocked",
      page: 2,
      limit: 20,
    });
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/professores?q=ana&verificacao=pendente&status=bloqueado&pagina=3",
    );
    expect(screen.getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      `/professores/${ID}`,
    );
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByLabelText("Verificação")).toHaveValue("pendente");
  });

  it("ignora valores desconhecidos e usa o primeiro de um parâmetro repetido", async () => {
    mocks.adminApi.professors.mockResolvedValue({ items: [item], total: 1, page: 1, limit: 20 });
    await ProfessoresPage({
      searchParams: Promise.resolve({
        verificacao: "talvez",
        status: ["ativo", "bloqueado"],
        pagina: "abc",
      }),
    });
    expect(mocks.adminApi.professors).toHaveBeenCalledWith({
      q: undefined,
      verified: undefined,
      status: "active",
      page: 1,
      limit: 20,
    });
  });

  it("lista vazia mostra o estado vazio", async () => {
    mocks.adminApi.professors.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    render(await ProfessoresPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhum professor encontrado.")).toBeInTheDocument();
  });

  it("sem curadoria não chama a API", async () => {
    mocks.isCurator.mockResolvedValue(false);
    expect(await ProfessoresPage({ searchParams: Promise.resolve({}) })).toBeNull();
    expect(mocks.adminApi.professors).not.toHaveBeenCalled();
  });
});
