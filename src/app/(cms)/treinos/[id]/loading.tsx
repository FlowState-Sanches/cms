/** Skeleton acessível do detalhe do treino. */
export default function TreinoLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando treino"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-surface" />
        <div className="h-7 w-72 animate-pulse rounded bg-surface" />
        <div className="h-4 w-48 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 animate-pulse rounded bg-surface" />
          <div className="h-64 w-full animate-pulse rounded bg-surface" />
          <div className="h-48 w-full animate-pulse rounded bg-surface" />
        </div>
        <div className="h-72 w-full animate-pulse rounded bg-surface" />
      </div>
      <span className="sr-only">Carregando treino…</span>
    </div>
  );
}
