import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CmsPillar } from "@/lib/api/schemas";
import { PillarTabs } from "./pillar-tabs";

const counts = { draft: 1, review: 2, published: 3, archived: 0 };
const pillars: CmsPillar[] = [
  { key: "tecnico", label: "Técnico", title: "Técnico", counts },
  { key: "fisico", label: "Físico", title: "Físico", counts },
  { key: "psiquico", label: "Psíquico", title: "Psíquico", counts },
  { key: "flow", label: "Flow", title: "Flow", counts },
];

describe("PillarTabs", () => {
  it("marca o pilar ativo e mostra o total de treinos", () => {
    render(<PillarTabs pillars={pillars} active="fisico" buildHref={(key) => `/treinos?pilar=${key}`} />);
    const nav = screen.getByRole("navigation", { name: "Pilares" });
    expect(within(nav).getByRole("link", { name: /Físico/ })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /Técnico/ })).toHaveTextContent("Técnico6");
  });

  it("no celular vira grade 2 x 2 com abas de 44 px, sem rolar a página", () => {
    render(<PillarTabs pillars={pillars} active="tecnico" buildHref={(key) => `/treinos?pilar=${key}`} />);
    const nav = screen.getByRole("navigation", { name: "Pilares" });
    expect(nav).toHaveClass("grid", "grid-cols-2", "md:flex");
    for (const link of within(nav).getAllByRole("link")) {
      expect(link).toHaveClass("min-h-11", "lg:min-h-0");
    }
  });

  it("no celular a aba ativa usa fundo cheio em vez do sublinhado (Finding 5)", () => {
    render(<PillarTabs pillars={pillars} active="fisico" buildHref={(key) => `/treinos?pilar=${key}`} />);
    const nav = screen.getByRole("navigation", { name: "Pilares" });
    const active = within(nav).getByRole("link", { name: /Físico/ });
    expect(active).toHaveClass("bg-primary-soft", "md:bg-transparent");
    const inactive = within(nav).getByRole("link", { name: /Técnico/ });
    expect(inactive).not.toHaveClass("bg-primary-soft");
  });
});
