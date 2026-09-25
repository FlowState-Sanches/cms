import { render, screen, within } from "@testing-library/react";
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

function renderTable() {
  render(
    <PeopleTable
      label="Professores"
      items={rows}
      hrefFor={(row) => `/professores/${row.id}`}
      columns={[{ header: "Aulas", cell: (row) => row.lessonsCount }]}
    />,
  );
}

describe("PeopleTable", () => {
  it("envolve a tabela numa região rolável e nomeada", () => {
    renderTable();
    const region = screen.getByRole("region", { name: "Professores" });
    expect(region).toHaveAttribute("tabIndex", "0");
    expect(within(region).getByRole("table", { name: "Professores" })).toBeInTheDocument();
  });

  it("monta as colunas base com as extras entre E-mail e Status", () => {
    renderTable();
    const table = screen.getByRole("table", { name: "Professores" });
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Nome",
      "E-mail",
      "Aulas",
      "Status",
      "Cadastro",
    ]);
    expect(within(table).getByText("12")).toBeInTheDocument();
  });

  it("linka o nome para o detalhe, mostra status e data em pt-BR no fuso de São Paulo (H6)", () => {
    renderTable();
    const table = screen.getByRole("table", { name: "Professores" });
    expect(within(table).getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      "/professores/u1",
    );
    expect(within(table).getByText("Bloqueado")).toBeInTheDocument();
    // 2026-09-01T12:00:00Z é 2026-09-01 09:00 em São Paulo (UTC-3).
    expect(within(table).getByText("01/09/2026 09:00")).toBeInTheDocument();
  });

  it("no celular cada pessoa vira um cartão com o nome como link e os campos rotulados", () => {
    renderTable();
    const cards = within(screen.getByRole("list", { name: "Professores" })).getAllByRole(
      "listitem",
    );
    expect(cards).toHaveLength(2);
    const [ana, beto] = cards;
    expect(within(ana!).getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      "/professores/u1",
    );
    expect(within(ana!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "E-mail",
      "Aulas",
      "Status",
      "Cadastro",
    ]);
    expect(within(ana!).getByText("ana@x.test")).toBeInTheDocument();
    expect(within(beto!).getByText("Bloqueado")).toBeInTheDocument();
  });
});
