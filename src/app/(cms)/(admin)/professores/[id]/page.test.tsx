import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { professor: vi.fn() },
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

import { ApiError } from "@/lib/api/errors";
import ProfessorPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const detail = {
  id: ID,
  name: "Ana Prof",
  email: "ana@x.test",
  verified: true,
  blocked: false,
  lessonsCount: 12,
  createdAt: "2026-09-01T12:00:00.000Z",
  profile: {
    bio: "Surf desde 2010.",
    location: "Florianópolis",
    specialties: ["Longboard", "Iniciantes"],
    pricePerHour: 150,
  },
  upcomingLessons: 3,
  groupEventsCount: 2,
  rating: { average: 4.75, count: 8 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("ProfessorPage", () => {
  it("mostra perfil, números e as ações de verificação e bloqueio", async () => {
    mocks.adminApi.professor.mockResolvedValue(detail);
    render(await ProfessorPage({ params: Promise.resolve({ id: ID }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Ana Prof" })).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover verificação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloquear" })).toBeInTheDocument();
    expect(screen.getByText("Florianópolis")).toBeInTheDocument();
    expect(screen.getByText("Longboard, Iniciantes")).toBeInTheDocument();
    expect(screen.getByText("Nota média 4,8")).toBeInTheDocument();
    expect(screen.getByText("Aulas em grupo e eventos").parentElement?.parentElement).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-4",
    );
    expect(screen.getByRole("button", { name: "Bloquear" }).parentElement).toHaveClass(
      "flex-col",
      "md:flex-row",
    );
  });

  it("professor sem perfil salvo mostra os campos como não informados", async () => {
    mocks.adminApi.professor.mockResolvedValue({ ...detail, profile: null });
    render(await ProfessorPage({ params: Promise.resolve({ id: ID }) }));
    expect(screen.getByText("Não informada")).toBeInTheDocument();
    expect(screen.getByText("Sem bio.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma")).toBeInTheDocument();
  });

  it("id fora do formato vira 404 sem chamar a API", async () => {
    await expect(
      ProfessorPage({ params: Promise.resolve({ id: "../admins" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.adminApi.professor).not.toHaveBeenCalled();
  });

  it("404 da API vira notFound", async () => {
    mocks.adminApi.professor.mockRejectedValue(new ApiError(404, "x", "USER_NOT_FOUND"));
    await expect(ProfessorPage({ params: Promise.resolve({ id: ID }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
