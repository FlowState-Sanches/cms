import Link from "next/link";
import { formatTimestamp } from "@/lib/labels";
import { PersonStatusBadge } from "./pill";
import { ResponsiveList, type ListColumn } from "./responsive-list";

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  createdAt: string;
};

/** Coluna extra de uma lista de pessoas: rótulo e render (formato de `ListColumn`). */
export type PeopleColumn<T> = ListColumn<T>;

type PeopleTableProps<T extends PersonRow> = {
  label: string;
  items: T[];
  hrefFor: (item: T) => string;
  /** Colunas próprias do tipo de pessoa, exibidas entre E-mail e Status. */
  columns?: PeopleColumn<T>[];
};

/**
 * Professores, alunos ou fotógrafos: tabela a partir de 768 px e cartões
 * abaixo, com o nome como link (spec 5.2). Server Component.
 */
export function PeopleTable<T extends PersonRow>({
  label,
  items,
  hrefFor,
  columns = [],
}: PeopleTableProps<T>) {
  return (
    <ResponsiveList
      label={label}
      caption={label}
      items={items}
      itemKey={(item) => item.id}
      tableMinWidth="min-w-[720px]"
      columns={[
        {
          header: "Nome",
          primary: true,
          cell: (item) => (
            <Link
              href={hrefFor(item)}
              className="font-medium text-text underline-offset-2 hover:underline focus-visible:underline"
            >
              {item.name}
            </Link>
          ),
        },
        { header: "E-mail", cell: (item) => item.email },
        ...columns,
        { header: "Status", cell: (item) => <PersonStatusBadge blocked={item.blocked} /> },
        { header: "Cadastro", cell: (item) => formatTimestamp(item.createdAt) },
      ]}
    />
  );
}
