import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { media: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));

import MidiasPage from "./page";

const PHOTOGRAPHER = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const item = {
  id: "m1",
  type: "video",
  status: "ready",
  thumbnailUrl: null,
  session: { id: "s1", location: "Praia Mole", sessionDate: "2026-09-24" },
  photographer: { id: PHOTOGRAPHER, name: "Carla Foto" },
  createdAt: "2026-09-24T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("MidiasPage", () => {
  it("traduz dia, tipo, status e fotógrafo para a API e preserva o fotógrafo no form", async () => {
    mocks.adminApi.media.mockResolvedValue({ items: [item], total: 1, page: 1, limit: 24 });
    const { container } = render(
      await MidiasPage({
        searchParams: Promise.resolve({
          dia: "2026-09-24",
          tipo: "video",
          status: "pronta",
          fotografo: PHOTOGRAPHER,
        }),
      }),
    );

    expect(mocks.adminApi.media).toHaveBeenCalledWith({
      date: "2026-09-24",
      type: "video",
      status: "ready",
      photographerId: PHOTOGRAPHER,
      page: 1,
      limit: 24,
    });
    expect(
      container.querySelector('input[type="hidden"][name="fotografo"]'),
    ).toHaveValue(PHOTOGRAPHER);
    expect(screen.getByRole("link", { name: "Ver de todos os fotógrafos" })).toHaveAttribute(
      "href",
      "/midias?dia=2026-09-24&tipo=video&status=pronta",
    );
  });

  it("descarta dia impossível, tipo desconhecido e fotógrafo que não é uuid", async () => {
    mocks.adminApi.media.mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 });
    render(
      await MidiasPage({
        searchParams: Promise.resolve({ dia: "2026-02-30", tipo: "gif", fotografo: "../x" }),
      }),
    );
    expect(mocks.adminApi.media).toHaveBeenCalledWith({
      date: undefined,
      type: undefined,
      status: undefined,
      photographerId: undefined,
      page: 1,
      limit: 24,
    });
    expect(screen.getByText("Nenhuma mídia encontrada.")).toBeInTheDocument();
  });

  it("depois da remoção anuncia em role=status", async () => {
    mocks.adminApi.media.mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 });
    render(await MidiasPage({ searchParams: Promise.resolve({ removida: "1" }) }));
    expect(screen.getByRole("status")).toHaveTextContent("Mídia removida.");
  });
});
