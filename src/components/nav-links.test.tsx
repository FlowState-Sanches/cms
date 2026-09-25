import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/painel" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { NavLinks, isActivePath, type NavItem } from "./nav-links";

const ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel" },
  { href: "/treinos", label: "Treinos" },
  { href: "/revisao", label: "Fila de revisão", count: 128 },
  { href: "/professores", label: "Professores" },
  { href: "/alunos", label: "Alunos" },
  { href: "/fotografos", label: "Fotógrafos" },
  { href: "/admins", label: "Admins" },
  { href: "/midias", label: "Mídias" },
];

beforeEach(() => {
  nav.pathname = "/painel";
});

describe("isActivePath", () => {
  it("vale para a própria rota e para as rotas abaixo dela", () => {
    expect(isActivePath("/professores", "/professores")).toBe(true);
    expect(isActivePath("/professores/7f3c", "/professores")).toBe(true);
    expect(isActivePath("/professores-x", "/professores")).toBe(false);
    expect(isActivePath("/treinos/novo", "/painel")).toBe(false);
  });
});

describe("NavLinks", () => {
  it("marca só o item da rota atual com aria-current=page", () => {
    nav.pathname = "/professores/7f3c";
    render(<NavLinks items={ITEMS} variant="bar" />);
    const navigation = screen.getByRole("navigation", { name: "Principal" });
    expect(within(navigation).getByRole("link", { name: "Professores" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(navigation).getByRole("link", { name: "Painel" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("barra: oculta abaixo de 1024 px", () => {
    render(<NavLinks items={ITEMS} variant="bar" />);
    expect(screen.getByRole("navigation", { name: "Principal" })).toHaveClass("hidden", "lg:flex");
  });

  it("menu: 8 itens empilhados com alvo de 44 px e o contador da fila sem quebrar o item", () => {
    render(<NavLinks items={ITEMS} variant="menu" />);
    const navigation = screen.getByRole("navigation", { name: "Principal" });
    expect(navigation).toHaveClass("flex-col");
    const links = within(navigation).getAllByRole("link");
    expect(links).toHaveLength(8);
    for (const link of links) {
      expect(link).toHaveClass("min-h-11");
    }
    const review = within(navigation).getByRole("link", { name: /Fila de revisão/ });
    expect(review).toHaveTextContent("Fila de revisão128");
    expect(within(review).getByText("128")).toHaveClass("shrink-0");
  });

  it("sem contador não renderiza número", () => {
    render(<NavLinks items={[{ href: "/treinos", label: "Treinos" }]} variant="menu" />);
    expect(screen.getByRole("link", { name: "Treinos" })).toHaveTextContent(/^Treinos$/);
  });
});
