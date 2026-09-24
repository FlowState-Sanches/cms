import Link from "next/link";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  /** Recebe o número da página e devolve o href correspondente (preserva os outros filtros). */
  buildHref: (page: number) => string;
};

/** Paginação simples (anterior/próxima + posição atual), 20 itens por página. */
export function Pagination({ page, limit, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between pt-2 text-sm">
      <span className="text-text-muted">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border border-border px-3 py-1.5 text-text hover:border-primary"
          >
            Anterior
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="rounded-md border border-border px-3 py-1.5 text-text-muted opacity-50"
          >
            Anterior
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border border-border px-3 py-1.5 text-text hover:border-primary"
          >
            Próxima
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="rounded-md border border-border px-3 py-1.5 text-text-muted opacity-50"
          >
            Próxima
          </span>
        )}
      </div>
    </nav>
  );
}
