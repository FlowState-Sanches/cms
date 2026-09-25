import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MediaListItem } from "@/lib/api/admin-schemas";
import { MediaGrid } from "./media-grid";

const item: MediaListItem = {
  id: "m1",
  type: "photo",
  status: "ready",
  thumbnailUrl: null,
  session: { id: "s1", location: "Praia Mole", sessionDate: "2026-09-24" },
  photographer: { id: "f1", name: "Carla Foto" },
  createdAt: "2026-09-24T10:00:00.000Z",
};

describe("MediaGrid", () => {
  it("cada mídia é um link com nome descritivo para o detalhe", () => {
    render(<MediaGrid items={[item, { ...item, id: "m2", type: "video", status: "failed" }]} />);
    expect(
      screen.getByRole("link", { name: "Foto da sessão em Praia Mole, 24/09/2026, Pronta" }),
    ).toHaveAttribute("href", "/midias/m1");
    expect(
      screen.getByRole("link", { name: "Vídeo da sessão em Praia Mole, 24/09/2026, Falhou" }),
    ).toHaveAttribute("href", "/midias/m2");
  });

  it("sem miniatura mostra o aviso no lugar da imagem", () => {
    render(<MediaGrid items={[item]} />);
    expect(screen.getByText("Sem miniatura")).toBeInTheDocument();
    expect(screen.getByText("Carla Foto")).toBeInTheDocument();
  });

  it("2 colunas no celular, 3 no tablet e 4 no desktop", () => {
    render(<MediaGrid items={[item]} />);
    const list = screen.getByRole("list", { name: "Mídias" });
    expect(list).toHaveClass("grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4");
    expect(list).not.toHaveClass("sm:grid-cols-3");
  });
});
