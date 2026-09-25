import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { mediaItem: vi.fn() },
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
vi.mock("@/app/(cms)/(admin)/midias/actions", () => ({ removeMediaAction: vi.fn() }));

import MidiaPage from "./page";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";
const detail = {
  id: ID,
  type: "photo",
  status: "ready",
  thumbnailUrl: null,
  session: { id: "s1", location: "Praia Mole", sessionDate: "2026-09-24" },
  photographer: { id: "f1", name: "Carla Foto" },
  createdAt: "2026-09-24T10:00:00.000Z",
  url: "https://s3.test/foto",
  sizeBytes: 2516582,
  width: 1920,
  height: 1080,
  durationSeconds: null,
  mimeType: "image/jpeg",
  paidOrders: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
});

describe("MidiaPage", () => {
  it("mostra pré-visualização, metadados e o botão de remover", async () => {
    mocks.adminApi.mediaItem.mockResolvedValue(detail);
    render(await MidiaPage({ params: Promise.resolve({ id: ID }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Foto da sessão em Praia Mole" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://s3.test/foto");
    expect(screen.getByText("2,4 MB")).toBeInTheDocument();
    expect(screen.getByText("1920 x 1080 px")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carla Foto" })).toHaveAttribute(
      "href",
      "/fotografos/f1",
    );
    expect(screen.getByRole("button", { name: "Remover mídia" })).toBeInTheDocument();
  });

  it("com pedido pago explica e não oferece remover", async () => {
    mocks.adminApi.mediaItem.mockResolvedValue({ ...detail, paidOrders: 2 });
    render(await MidiaPage({ params: Promise.resolve({ id: ID }) }));
    expect(
      screen.getByText("Esta mídia tem 2 pedidos pagos e não pode ser removida."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover mídia" })).not.toBeInTheDocument();
  });

  it("id fora do formato vira 404", async () => {
    await expect(MidiaPage({ params: Promise.resolve({ id: "m1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
