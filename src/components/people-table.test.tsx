import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeopleTable, type PersonRow } from "./people-table";

type Row = PersonRow & { lessonsCount: number };

const rows: Row[] = [
  {
    id: "u1",
    name: "Ana Prof",
    email: "ana@x.test",
    blocked: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    lessonsCount: 12,
  },
  {
    id: "u2",
    name: "Beto Prof",
    email: "beto@x.test",
    blocked: true,
    createdAt: "2026-08-15T12:00:00.000Z",
    lessonsCount: 0,
  },
];

describe("PeopleTable", () => {
  it("envolve a tabela numa região rolável e nomeada", () => {
    render(<PeopleTable label="Professores" items={rows} hrefFor={(row) => `/professores/${row.id}`} />);
    const region = screen.getByRole("region", { name: "Professores" });
    expect(region).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("table", { name: "Professores" })).toBeInTheDocument();
  });

  it("monta as colunas base com as extras entre E-mail e Status", () => {
    render(
      <PeopleTable
        label="Professores"
        items={rows}
        hrefFor={(row) => `/professores/${row.id}`}
        columns={[{ header: "Aulas", cell: (row) => row.lessonsCount }]}
      />,
    );
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Nome",
      "E-mail",
      "Aulas",
      "Status",
      "Cadastro",
    ]);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("linka o nome para o detalhe, mostra status e data em pt-BR", () => {
    render(<PeopleTable label="Professores" items={rows} hrefFor={(row) => `/professores/${row.id}`} />);
    expect(screen.getByRole("link", { name: "Ana Prof" })).toHaveAttribute("href", "/professores/u1");
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText("01/09/2026")).toBeInTheDocument();
  });
});
