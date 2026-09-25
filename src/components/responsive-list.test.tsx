import { render, screen, within } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import { ResponsiveList, type ListColumn } from "./responsive-list";

type Row = { id: string; name: string; email: string; lessons: number };

const rows: Row[] = [
  { id: "u1", name: "Ana Prof", email: "ana@x.test", lessons: 12 },
  { id: "u2", name: "Beto Prof", email: "beto@x.test", lessons: 0 },
];

const columns: ListColumn<Row>[] = [
  {
    header: "Nome",
    cell: (row) => <Link href={`/professores/${row.id}`}>{row.name}</Link>,
  },
  { header: "E-mail", cell: (row) => row.email },
  { header: "Aulas", cell: (row) => row.lessons },
];

function renderList(items: Row[] = rows, cols: ListColumn<Row>[] = columns) {
  render(
    <ResponsiveList
      label="Lista de professores"
      caption="Professores"
      items={items}
      itemKey={(row) => row.id}
      columns={cols}
      tableMinWidth="min-w-[720px]"
    />,
  );
}

describe("ResponsiveList", () => {
  it("tabela numa região rolável e nomeada, visível só a partir de 768 px", () => {
    renderList();
    const region = screen.getByRole("region", { name: "Lista de professores" });
    expect(region).toHaveClass("hidden", "md:block", "overflow-x-auto");
    expect(region).toHaveAttribute("tabIndex", "0");
    const table = within(region).getByRole("table", { name: "Professores" });
    expect(table).toHaveClass("min-w-[720px]");
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Nome",
      "E-mail",
      "Aulas",
    ]);
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("cartões só abaixo de 768 px, com o nome acessível igual à legenda da tabela", () => {
    renderList();
    const list = screen.getByRole("list", { name: "Professores" });
    expect(list).toHaveClass("md:hidden");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("cada cartão tem o campo principal como título e os demais como rótulo e valor", () => {
    renderList();
    const [ana] = within(screen.getByRole("list", { name: "Professores" })).getAllByRole(
      "listitem",
    );
    expect(within(ana!).getByRole("link", { name: "Ana Prof" })).toHaveAttribute(
      "href",
      "/professores/u1",
    );
    expect(within(ana!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "E-mail",
      "Aulas",
    ]);
    expect(within(ana!).getAllByRole("definition").map((value) => value.textContent)).toEqual([
      "ana@x.test",
      "12",
    ]);
  });

  it("primary escolhe outra coluna como título do cartão sem mudar a ordem da tabela", () => {
    renderList(rows, [
      { header: "Aulas", cell: (row) => row.lessons },
      { header: "Nome", primary: true, cell: (row) => row.name },
      { header: "E-mail", cell: (row) => row.email },
    ]);
    const table = screen.getByRole("table", { name: "Professores" });
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Aulas",
      "Nome",
      "E-mail",
    ]);
    const [ana] = within(screen.getByRole("list", { name: "Professores" })).getAllByRole(
      "listitem",
    );
    expect(ana!.firstElementChild).toHaveTextContent(/^Ana Prof$/);
    expect(within(ana!).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Aulas",
      "E-mail",
    ]);
  });

  it("o título do cartão é um alvo de toque de 44 px quando é um link (Finding 4)", () => {
    renderList();
    const [ana] = within(screen.getByRole("list", { name: "Professores" })).getAllByRole(
      "listitem",
    );
    const link = within(ana!).getByRole("link", { name: "Ana Prof" });
    expect(link.parentElement).toHaveClass("inline-flex", "min-h-11", "items-center");
  });

  it("valores longos sem espaço quebram dentro do cartão (Review Focus 1)", () => {
    const longName = "A".repeat(60);
    const longEmail = `${"a".repeat(60)}@flowstate.test`;
    renderList([{ id: "u3", name: longName, email: longEmail, lessons: 1 }]);
    const [card] = within(screen.getByRole("list", { name: "Professores" })).getAllByRole(
      "listitem",
    );
    expect(card).toHaveClass("min-w-0");
    const title = within(card!).getByRole("link", { name: longName }).parentElement;
    expect(title).toHaveClass("min-w-0", "wrap-anywhere");
    expect(within(card!).getByText(longEmail)).toHaveClass("min-w-0", "wrap-anywhere");
  });
});
