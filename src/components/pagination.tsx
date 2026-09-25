import Link from "next/link";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  /** Recebe o número da página e devolve o href correspondente (preserva os outros filtros). */
  buildHref: (page: number) => string;
};

const CONTROL =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 py-1.5 lg:min-h-0 lg:min-w-0";

/**
 * Paginação simples (anterior/próxima + posição atual). Abaixo de 1024 px a
 * posição fica entre os botões, que têm 44 px (spec 5.5); a partir de 1024
 * px volta ao visual atual, com a posição à esquerda.
 */
export function Pagination({ page, limit, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-2 pt-2 text-sm lg:justify-end"
    >
      {hasPrev ? (
        <Link href={buildHref(page - 1)} className={`${CONTROL} text-text hover:border-primary`}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={`${CONTROL} text-text-muted opacity-50`}>
          Anterior
        </span>
      )}
      <span className="whitespace-nowrap text-text-muted lg:order-first lg:mr-auto">
        Página {page} de {totalPages}
      </span>
      {hasNext ? (
        <Link href={buildHref(page + 1)} className={`${CONTROL} text-text hover:border-primary`}>
          Próxima
        </Link>
      ) : (
        <span aria-disabled="true" className={`${CONTROL} text-text-muted opacity-50`}>
          Próxima
        </span>
      )}
    </nav>
  );
}
