import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState, PastPageEmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("mostra título e descrição com respiro menor no celular", () => {
    render(<EmptyState title="Nenhum aluno encontrado." description="Ajuste a busca ou os filtros." />);
    expect(screen.getByText("Nenhum aluno encontrado.").parentElement).toHaveClass(
      "px-4",
      "md:px-6",
    );
    expect(screen.getByText("Ajuste a busca ou os filtros.")).toBeInTheDocument();
  });

  it("página além do fim oferece voltar à primeira página com alvo de 44 px", () => {
    render(<PastPageEmptyState firstPageHref="/alunos" />);
    expect(screen.getByRole("link", { name: "Voltar para a primeira página" })).toHaveClass(
      "min-h-11",
      "lg:min-h-0",
    );
  });
});
