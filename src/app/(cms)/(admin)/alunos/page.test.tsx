import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { students: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));

import AlunosPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const item = {
  id: ID,
  name: "Bruno Aluno",
  email: "bruno@x.test",
  plan: "paid",
  blocked: true,
  createdAt: "2026-09-01T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("AlunosPage", () => {
  it("traduz plano e status da URL para a API e mostra o selo de plano", async () => {
    mocks.adminApi.students.mockResolvedValue({ items: [item], total: 30, page: 1, limit: 20 });
    render(
      await AlunosPage({
        searchParams: Promise.resolve({ q: "bruno", plano: "pago", status: "bloqueado" }),
      }),
    );

    expect(mocks.adminApi.students).toHaveBeenCalledWith({
      q: "bruno",
      plan: "paid",
      status: "blocked",
      page: 1,
      limit: 20,
    });
    expect(screen.getByText("Pago")).toBeInTheDocument();
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bruno Aluno" })).toHaveAttribute(
      "href",
      `/alunos/${ID}`,
    );
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/alunos?q=bruno&plano=pago&status=bloqueado&pagina=2",
    );
  });

  it("plano desconhecido é ignorado", async () => {
    mocks.adminApi.students.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    render(await AlunosPage({ searchParams: Promise.resolve({ plano: "vip" }) }));
    expect(mocks.adminApi.students).toHaveBeenCalledWith(
      expect.objectContaining({ plan: undefined }),
    );
    expect(screen.getByText("Nenhum aluno encontrado.")).toBeInTheDocument();
  });

  it("página além do fim (total > 0, items vazio) oferece link de volta em vez de estado vazio genérico", async () => {
    mocks.adminApi.students.mockResolvedValue({ items: [], total: 30, page: 5, limit: 20 });
    render(await AlunosPage({ searchParams: Promise.resolve({ pagina: "5", q: "bruno" }) }));

    expect(screen.queryByText("Nenhum aluno encontrado.")).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /primeira página/i });
    expect(link).toHaveAttribute("href", "/alunos?q=bruno");
  });

  it("sem curadoria não chama a API", async () => {
    mocks.isCurator.mockResolvedValue(false);
    expect(await AlunosPage({ searchParams: Promise.resolve({}) })).toBeNull();
    expect(mocks.adminApi.students).not.toHaveBeenCalled();
  });
});
