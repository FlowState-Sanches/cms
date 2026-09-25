import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CmsAccess } from "@/lib/api/schemas";
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

function navHrefs(): (string | null)[] {
  const nav = screen.getByRole("navigation", { name: "Principal" });
  return within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

describe("AppShell: navegação por papel", () => {
  it("professor vê só Treinos", () => {
    render(
      <AppShell access={professor} reviewCount={0}>
        <p>x</p>
      </AppShell>,
    );
    expect(navHrefs()).toEqual(["/treinos"]);
  });

  it("admin vê as áreas de gestão, na ordem, com o contador da fila", () => {
    render(
      <AppShell access={admin} reviewCount={3}>
        <p>x</p>
      </AppShell>,
    );
    expect(navHrefs()).toEqual([
      "/painel",
      "/treinos",
      "/revisao",
      "/professores",
      "/alunos",
      "/fotografos",
      "/admins",
      "/midias",
    ]);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getByRole("link", { name: /Fila de revisão/ })).toHaveTextContent(
      "Fila de revisão3",
    );
    expect(within(nav).getByRole("link", { name: "Fotógrafos" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Mídias" })).toBeInTheDocument();
  });
});
