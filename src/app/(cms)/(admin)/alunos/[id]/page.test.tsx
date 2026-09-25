import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { student: vi.fn() },
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: mocks.notFound,
}));
vi.mock("@/app/(cms)/(admin)/actions", () => ({
  setBlockedAction: vi.fn(),
  setVerifiedAction: vi.fn(),
}));

import AlunoPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const detail = {
  id: ID,
  name: "Bruno Aluno",
  email: "bruno@x.test",
  plan: "free",
  blocked: false,
  createdAt: "2026-09-01T12:00:00.000Z",
  lessonsCount: 7,
  enrollmentsCount: 2,
  taggedSessionsCount: 5,
  recentLessons: [
    {
      id: "b1",
      date: "2026-09-20",
      startTime: "08:00:00",
      professor: { id: "p1", name: "Ana Prof" },
      status: "cancelled",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("AlunoPage", () => {
  it("mostra plano, números, aulas recentes e o botão Bloquear", async () => {
    mocks.adminApi.student.mockResolvedValue(detail);
    render(await AlunoPage({ params: Promise.resolve({ id: ID }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Bruno Aluno" })).toBeInTheDocument();
    expect(screen.getByText("Gratuito")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloquear" })).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Aulas recentes" });
    expect(within(table).getByText("20/09/2026")).toBeInTheDocument();
    expect(within(table).getByText("08:00")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      "/professores/p1",
    );
    expect(within(table).getByText("Cancelada")).toBeInTheDocument();

    const [card] = within(screen.getByRole("list", { name: "Aulas recentes" })).getAllByRole(
      "listitem",
    );
    expect(within(card!).getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      "/professores/p1",
    );
    expect(within(card!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Data",
      "Horário",
      "Status",
    ]);
  });

  it("sem aulas mostra estado vazio", async () => {
    mocks.adminApi.student.mockResolvedValue({ ...detail, recentLessons: [] });
    render(await AlunoPage({ params: Promise.resolve({ id: ID }) }));
    expect(screen.getByText("Nenhuma aula registrada.")).toBeInTheDocument();
  });

  it("id fora do formato vira 404 sem chamar a API", async () => {
    await expect(AlunoPage({ params: Promise.resolve({ id: "abc" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.adminApi.student).not.toHaveBeenCalled();
  });
});
