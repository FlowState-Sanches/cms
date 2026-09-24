import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getAccess: vi.fn() }));
vi.mock("@/lib/api/cached", () => ({ getAccess: mocks.getAccess }));

import AdminLayout from "./layout";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminLayout", () => {
  it("curadoria vê o conteúdo", async () => {
    mocks.getAccess.mockResolvedValue({
      canEdit: true,
      canCurate: true,
      user: { id: "a", name: "Admin" },
    });
    render(await AdminLayout({ children: <p>Conteúdo de gestão</p> }));
    expect(screen.getByText("Conteúdo de gestão")).toBeInTheDocument();
  });

  it("professor vê Acesso restrito, com link para Treinos, sem o conteúdo", async () => {
    mocks.getAccess.mockResolvedValue({
      canEdit: true,
      canCurate: false,
      user: { id: "p", name: "Prof" },
    });
    render(await AdminLayout({ children: <p>Conteúdo de gestão</p> }));
    expect(screen.getByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para Treinos" })).toHaveAttribute(
      "href",
      "/treinos",
    );
    expect(screen.queryByText("Conteúdo de gestão")).not.toBeInTheDocument();
  });
});
