import { render, screen } from "@testing-library/react";
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

    const link = screen.getByRole("link", { name: /Fundamentos de passe/ });
    expect(link).toHaveAttribute("href", "/treinos/tecnico-abc");
  });

  it("mostra 'FlowState' quando o autor é nulo", () => {
    render(<TrainingTable items={[makeItem({ author: null })]} />);

    expect(screen.getByText("FlowState")).toBeInTheDocument();
  });

  it("formata a data de atualização em pt-BR", () => {
    render(<TrainingTable items={[makeItem({ updatedAt: "2026-09-01T12:00:00.000Z" })]} />);

    expect(screen.getByText("01/09/2026")).toBeInTheDocument();
  });
});
