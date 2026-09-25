import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CmsTrainingListItem } from "@/lib/api/schemas";
import { TrainingTable } from "./training-table";

function makeItem(overrides: Partial<CmsTrainingListItem> = {}): CmsTrainingListItem {
  return {
    id: "tecnico-abc",
    code: "ABC",
    pillar: "tecnico",
    order: 1,
    title: "Fundamentos de passe",
    levelLabel: "Iniciante",
    status: "published",
    author: { id: "u1", name: "Ana Autora" },
    hasVideo: true,
    updatedAt: "2026-09-01T12:00:00.000Z",
    publishedAt: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

function table(): HTMLElement {
  return screen.getByRole("table", { name: "Lista de treinos do pilar selecionado" });
}

function cards(): HTMLElement[] {
  return within(
    screen.getByRole("list", { name: "Lista de treinos do pilar selecionado" }),
  ).getAllByRole("listitem");
}

describe("TrainingTable", () => {
  it("envolve a tabela em uma região com scroll focável (evita quebrar layout em tablet)", () => {
    render(<TrainingTable items={[makeItem()]} />);

    const region = screen.getByRole("region", { name: "Treinos" });
    expect(region).toHaveClass("overflow-x-auto");
    expect(region).toHaveAttribute("tabIndex", "0");
    expect(region.querySelector("table")).not.toBeNull();
  });

  it("renderiza os cabeçalhos esperados", () => {
    render(<TrainingTable items={[makeItem()]} />);

    expect(screen.getByRole("columnheader", { name: "Ordem" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Código" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nível" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Autor" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Atualizado" })).toBeInTheDocument();
  });

  it("linka cada linha para /treinos/<id>", () => {
    render(<TrainingTable items={[makeItem({ id: "tecnico-abc", title: "Fundamentos de passe" })]} />);

    const link = within(table()).getByRole("link", { name: /Fundamentos de passe/ });
    expect(link).toHaveAttribute("href", "/treinos/tecnico-abc");
  });

  it("mostra 'FlowState' quando o autor é nulo", () => {
    render(<TrainingTable items={[makeItem({ author: null })]} />);

    expect(within(table()).getByText("FlowState")).toBeInTheDocument();
  });

  it("formata a data de atualização em pt-BR", () => {
    render(<TrainingTable items={[makeItem({ updatedAt: "2026-09-01T12:00:00.000Z" })]} />);

    expect(within(table()).getByText("01/09/2026")).toBeInTheDocument();
  });

  it("no celular o cartão tem o título como link e os demais campos rotulados", () => {
    render(<TrainingTable items={[makeItem()]} />);

    const [card] = cards();
    expect(within(card!).getByRole("link", { name: "Fundamentos de passe" })).toHaveAttribute(
      "href",
      "/treinos/tecnico-abc",
    );
    expect(within(card!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Ordem",
      "Código",
      "Nível",
      "Status",
      "Autor",
      "Atualizado",
    ]);
  });

  it("título longo quebra dentro do cartão (Review Focus 3)", () => {
    const longTitle = "Treino".repeat(20);
    render(<TrainingTable items={[makeItem({ title: longTitle })]} />);

    const [card] = cards();
    expect(within(card!).getByRole("link", { name: longTitle }).parentElement).toHaveClass(
      "min-w-0",
      "wrap-anywhere",
    );
  });
});
