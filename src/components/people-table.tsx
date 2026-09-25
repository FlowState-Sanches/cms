import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/labels";
import { PersonStatusBadge } from "./pill";

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  createdAt: string;
};

export type PeopleColumn<T> = { header: string; cell: (item: T) => ReactNode };

type PeopleTableProps<T extends PersonRow> = {
  label: string;
  items: T[];
  hrefFor: (item: T) => string;
  /** Colunas próprias do tipo de pessoa, exibidas entre E-mail e Status. */
  columns?: PeopleColumn<T>[];
};

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2";

/** Tabela de professores, alunos ou fotógrafos. Server Component. */
export function PeopleTable<T extends PersonRow>({
  label,
  items,
  hrefFor,
  columns = [],
}: PeopleTableProps<T>) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
            <th scope="col" className={TH}>
              Nome
            </th>
            <th scope="col" className={TH}>
              E-mail
            </th>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={TH}>
                {column.header}
              </th>
            ))}
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={TH}>
              Cadastro
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/60">
              <td className={TD}>
                <Link
                  href={hrefFor(item)}
                  className="font-medium text-text underline-offset-2 hover:underline focus-visible:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className={`${TD} text-text-muted`}>{item.email}</td>
              {columns.map((column) => (
                <td key={column.header} className={`${TD} text-text-muted`}>
                  {column.cell(item)}
                </td>
              ))}
              <td className={TD}>
                <PersonStatusBadge blocked={item.blocked} />
              </td>
              <td className={`${TD} text-text-muted`}>{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
