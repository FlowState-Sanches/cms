import { Fragment, type ReactNode } from "react";

export type ListColumn<T> = {
  /** Rótulo da coluna na tabela e do campo no cartão. Único dentro da lista. */
  header: string;
  cell: (item: T) => ReactNode;
  /** Vira o título do cartão no celular. Sem nenhuma marcada, vale a primeira coluna. */
  primary?: boolean;
};

type ResponsiveListProps<T> = {
  /** Nome da região rolável que envolve a tabela. */
  label: string;
  /** Legenda da tabela; também é o `aria-label` da lista de cartões. */
  caption: string;
  items: T[];
  itemKey: (item: T) => string;
  columns: ListColumn<T>[];
  /** Largura mínima da tabela; se faltar espaço, a região rola na horizontal. */
  tableMinWidth: "min-w-[560px]" | "min-w-[640px]" | "min-w-[720px]";
};

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2 text-text-muted";

/**
 * Lista tabular responsiva (spec 5.2). Server Component. Renderiza as duas
 * versões a partir das mesmas colunas: a `<table>` numa região rolável e
 * rotulada a partir de 768 px, e uma `<ul>` de cartões abaixo disso, com o
 * campo principal como título e os demais em `<dl>`. O CSS esconde uma
 * delas com `display: none`, que também a tira da árvore de
 * acessibilidade, então leitor de tela e `getByRole` do Playwright só veem
 * a visível. No jsdom (sem CSS) as duas aparecem: escope as consultas.
 */
export function ResponsiveList<T>({
  label,
  caption,
  items,
  itemKey,
  columns,
  tableMinWidth,
}: ResponsiveListProps<T>) {
  const primaryIndex = Math.max(
    0,
    columns.findIndex((column) => column.primary),
  );
  const primary = columns[primaryIndex];
  const details = columns.filter((_, index) => index !== primaryIndex);

  return (
    <>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className="hidden overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:block"
      >
        <table className={`w-full ${tableMinWidth} border-collapse text-left text-sm`}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              {columns.map((column) => (
                <th key={column.header} scope="col" className={TH}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={itemKey(item)} className="border-b border-border/60">
                {columns.map((column) => (
                  <td key={column.header} className={TD}>
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li
            key={itemKey(item)}
            className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-surface p-4 text-sm"
          >
            {primary && (
              <div className="min-w-0 font-medium text-text wrap-anywhere">
                {primary.cell(item)}
              </div>
            )}
            {details.length > 0 && (
              <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-2">
                {details.map((column) => (
                  <Fragment key={column.header}>
                    <dt className="text-xs uppercase tracking-wide text-text-muted">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-text-muted wrap-anywhere">{column.cell(item)}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
