/** Skeleton acessível genérico para as páginas sob o shell `(cms)`. */
export default function CmsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando"
      className="flex flex-1 flex-col gap-4"
    >
      <div className="h-7 w-48 animate-pulse rounded bg-surface" />
      <div className="h-40 w-full animate-pulse rounded bg-surface" />
      <div className="h-40 w-full animate-pulse rounded bg-surface" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
