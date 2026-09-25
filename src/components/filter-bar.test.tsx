import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterBar } from "./filter-bar";

describe("FilterBar", () => {
  it("é um form GET de busca com rótulos e valores atuais", () => {
    const { container } = render(
      <FilterBar
        label="Filtrar professores"
        action="/professores"
        fields={[
          { kind: "search", name: "q", label: "Buscar por nome ou e-mail", value: "ana" },
          {
            kind: "select",
            name: "status",
            label: "Status",
            value: "bloqueado",
            options: [
              { value: "ativo", label: "Ativos" },
              { value: "bloqueado", label: "Bloqueados" },
            ],
          },
          { kind: "date", name: "dia", label: "Dia da sessão", value: "2026-09-24" },
          { kind: "hidden", name: "fotografo", value: "f1" },
        ]}
      />,
    );

    const form = screen.getByRole("search", { name: "Filtrar professores" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/professores");
    expect(screen.getByLabelText("Buscar por nome ou e-mail")).toHaveValue("ana");
    expect(screen.getByLabelText("Status")).toHaveValue("bloqueado");
    expect(screen.getByRole("option", { name: "Todos" })).toHaveValue("");
    expect(screen.getByLabelText("Dia da sessão")).toHaveValue("2026-09-24");
    expect(container.querySelector('input[type="hidden"][name="fotografo"]')).toHaveValue("f1");
    expect(screen.getByRole("button", { name: "Filtrar" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/professores");
  });

  it("no celular empilha os campos em largura total; a partir de 768 px fica em linha", () => {
    render(
      <FilterBar
        label="Filtrar alunos"
        action="/alunos"
        fields={[{ kind: "search", name: "q", label: "Buscar", value: "" }]}
      />,
    );
    expect(screen.getByRole("search", { name: "Filtrar alunos" })).toHaveClass(
      "flex-col",
      "md:flex-row",
      "md:flex-wrap",
    );
    expect(screen.getByLabelText("Buscar")).toHaveClass("w-full", "md:w-auto", "min-h-11");
    expect(screen.getByRole("button", { name: "Filtrar" })).toHaveClass(
      "w-full",
      "md:w-auto",
      "min-h-11",
      "lg:min-h-0",
    );
    expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveClass("min-h-11");
  });
});
