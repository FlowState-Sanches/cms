import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { photographer: vi.fn() },
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

import FotografoPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("FotografoPage", () => {
  it("mostra totais, sessões recentes com link para as mídias e o bloqueio", async () => {
    mocks.adminApi.photographer.mockResolvedValue({
      id: ID,
      name: "Carla Foto",
      email: "carla@x.test",
      blocked: true,
      sessionsCount: 4,
      photosCount: 1200,
      videosCount: 8,
      createdAt: "2026-09-01T12:00:00.000Z",
      recentSessions: [
        { id: "s1", location: "Joaquina", sessionDate: "2026-09-24", photoCount: 40, videoCount: 2 },
      ],
    });
    render(await FotografoPage({ params: Promise.resolve({ id: ID }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Carla Foto" })).toBeInTheDocument();
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desbloquear" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas as mídias" })).toHaveAttribute(
      "href",
      `/midias?fotografo=${ID}`,
    );

    const table = screen.getByRole("table", { name: "Sessões recentes" });
    expect(within(table).getByText("24/09/2026")).toBeInTheDocument();
    expect(
      within(table).getByRole("link", { name: "Ver mídias da sessão em Joaquina" }),
    ).toHaveAttribute("href", `/midias?dia=2026-09-24&fotografo=${ID}`);

    const [card] = within(screen.getByRole("list", { name: "Sessões recentes" })).getAllByRole(
      "listitem",
    );
    expect(card!.firstElementChild).toHaveTextContent(/^Joaquina$/);
    expect(
      within(card!).getByRole("link", { name: "Ver mídias da sessão em Joaquina" }),
    ).toBeInTheDocument();
  });

  it("id fora do formato vira 404", async () => {
    await expect(FotografoPage({ params: Promise.resolve({ id: "x" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
