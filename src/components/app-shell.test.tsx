import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CmsAccess } from "@/lib/api/schemas";

vi.mock("next/navigation", () => ({ usePathname: () => "/painel" }));

import { AppShell } from "./app-shell";

const professor: CmsAccess = {
  canEdit: true,
  canCurate: false,
  user: { id: "p", name: "Prof" },
};
const admin: CmsAccess = {
  canEdit: true,
  canCurate: true,
  user: { id: "a", name: "Admin" },
};

const ADMIN_HREFS = [
  "/painel",
  "/treinos",
  "/revisao",
  "/professores",
  "/alunos",
  "/fotografos",
  "/admins",
  "/midias",
];

/** Barra (a partir de 1024 px) e menu (abaixo) ficam no DOM; o CSS mostra uma por vez. */
function navs(): HTMLElement[] {
  return screen.getAllByRole("navigation", { name: "Principal" });
}

function hrefs(nav: HTMLElement): (string | null)[] {
  return within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

describe("AppShell: navegação por papel", () => {
  it("professor vê só Treinos, na barra e no menu", () => {
    render(
      <AppShell access={professor} reviewCount={0}>
        <p>x</p>
      </AppShell>,
    );
    const all = navs();
    expect(all).toHaveLength(2);
    for (const nav of all) {
      expect(hrefs(nav)).toEqual(["/treinos"]);
    }
  });

  it("admin vê as áreas de gestão, na ordem, com o contador da fila", () => {
    render(
      <AppShell access={admin} reviewCount={3}>
        <p>x</p>
      </AppShell>,
    );
    for (const nav of navs()) {
      expect(hrefs(nav)).toEqual(ADMIN_HREFS);
      expect(within(nav).getByRole("link", { name: /Fila de revisão/ })).toHaveTextContent(
        "Fila de revisão3",
      );
      expect(within(nav).getByRole("link", { name: "Fotógrafos" })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: "Mídias" })).toBeInTheDocument();
    }
  });
});

describe("AppShell: layout responsivo", () => {
  it("barra só a partir de 1024 px; abaixo, menu com itens, usuário, papel e Sair", () => {
    const { container } = render(
      <AppShell access={admin} reviewCount={3}>
        <p>x</p>
      </AppShell>,
    );
    const [bar, menuNav] = navs();
    expect(bar).toHaveClass("hidden", "lg:flex");
    const details = container.querySelector<HTMLElement>("header details");
    expect(details).toHaveClass("lg:hidden");
    expect(details).toContainElement(menuNav ?? null);
    const menu = within(details as HTMLElement);
    expect(menu.getByText("Admin")).toBeInTheDocument();
    expect(menu.getByText("Curadoria")).toBeInTheDocument();
    expect(menu.getByRole("button", { name: "Sair" })).toHaveClass("min-h-11", "w-full");
    expect(screen.getAllByRole("button", { name: "Sair" })).toHaveLength(2);
  });

  it("marca o item da rota atual com aria-current=page nas duas navegações", () => {
    render(
      <AppShell access={admin} reviewCount={0}>
        <p>x</p>
      </AppShell>,
    );
    for (const nav of navs()) {
      expect(within(nav).getByRole("link", { name: "Painel" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  it("conteúdo com respiro menor no celular e sem forçar largura", () => {
    render(
      <AppShell access={admin} reviewCount={0}>
        <p>x</p>
      </AppShell>,
    );
    expect(screen.getByRole("main")).toHaveClass("min-w-0", "px-4", "py-4", "md:px-6", "md:py-6");
  });
});
