import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ pathname: "/painel" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { MobileMenu } from "./mobile-menu";

function menu() {
  return (
    <MobileMenu>
      <a href="#professores">Professores</a>
    </MobileMenu>
  );
}

function renderMenu() {
  const utils = render(menu());
  const details = utils.container.querySelector("details");
  if (!details) {
    throw new Error("details ausente");
  }
  return { ...utils, details };
}

beforeEach(() => {
  nav.pathname = "/painel";
});

describe("MobileMenu", () => {
  it("é um <details> fechado, oculto a partir de 1024 px, com o botão Menu de 44 px", () => {
    const { details } = renderMenu();
    expect(details.open).toBe(false);
    expect(details).toHaveClass("lg:hidden");
    const summary = screen.getByText("Menu");
    expect(summary.tagName).toBe("SUMMARY");
    expect(summary).toHaveClass("min-h-11", "min-w-11");
  });

  it("abre pelo botão Menu (comportamento nativo do <details>)", () => {
    const { details } = renderMenu();
    fireEvent.click(screen.getByText("Menu"));
    expect(details.open).toBe(true);
  });

  it("fecha quando o pathname muda (navegação)", () => {
    const { details, rerender } = renderMenu();
    details.open = true;
    nav.pathname = "/professores";
    rerender(menu());
    expect(details.open).toBe(false);
  });

  it("fecha ao escolher um item, mesmo que seja a rota atual", () => {
    const { details } = renderMenu();
    details.open = true;
    fireEvent.click(screen.getByRole("link", { name: "Professores" }));
    expect(details.open).toBe(false);
  });

  it("Esc fecha e devolve o foco ao botão Menu", () => {
    const { details } = renderMenu();
    details.open = true;
    const link = screen.getByRole("link", { name: "Professores" });
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(screen.getByText("Menu")).toHaveFocus();
  });

  it("Esc com o menu fechado não mexe no foco", () => {
    renderMenu();
    const link = screen.getByRole("link", { name: "Professores" });
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(link).toHaveFocus();
  });

  it("fecha ao clicar (pointerdown) fora do menu, com o menu aberto", () => {
    const { details } = renderMenu();
    details.open = true;
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });

  it("pointerdown fora não faz nada quando o menu já está fechado", () => {
    const { details } = renderMenu();
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });

  it("pointerdown dentro do painel não fecha o menu", () => {
    const { details } = renderMenu();
    details.open = true;
    fireEvent.pointerDown(screen.getByRole("link", { name: "Professores" }));
    expect(details.open).toBe(true);
  });
});
