import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonHeader } from "./person-header";

const longName = "Ana".repeat(20);
const longEmail = `${"a".repeat(60)}@flowstate.test`;

function renderHeader() {
  render(
    <PersonHeader
      backHref="/alunos"
      backLabel="Voltar para alunos"
      name={longName}
      email={longEmail}
      meta="Cadastro em 01/09/2026 09:00"
      actions={<button type="button">Bloquear</button>}
    />,
  );
}

describe("PersonHeader", () => {
  it("nome e e-mail longos quebram em vez de alargar a página (Review Focus 1)", () => {
    renderHeader();
    expect(screen.getByRole("heading", { level: 1, name: longName })).toHaveClass(
      "min-w-0",
      "wrap-anywhere",
    );
    expect(screen.getByText(longEmail)).toHaveClass("wrap-anywhere");
  });

  it("ações empilham em largura total abaixo de 768 px e ficam em linha a partir dele", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: "Bloquear" }).parentElement).toHaveClass(
      "flex-col",
      "w-full",
      "md:flex-row",
      "md:w-auto",
    );
  });

  it("voltar tem alvo de 44 px abaixo de 1024 px", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Voltar para alunos" })).toHaveClass(
      "min-h-11",
      "lg:min-h-0",
    );
  });
});
