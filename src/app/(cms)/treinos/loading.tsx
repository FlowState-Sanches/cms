const SKELETON_ROWS = 6;

/** Skeleton acessível exibido enquanto a lista de treinos carrega. */
export default function TreinosLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando treinos"
      className="flex flex-1 flex-col gap-4"
    >
      <div className="h-7 w-32 animate-pulse rounded bg-surface" />
      <div className="flex gap-2 border-b border-border pb-2">
        <div className="h-8 w-20 animate-pulse rounded bg-surface" />
        <div className="h-8 w-20 animate-pulse rounded bg-surface" />
        <div className="h-8 w-20 animate-pulse rounded bg-surface" />
        <div className="h-8 w-20 animate-pulse rounded bg-surface" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <div key={index} className="h-10 w-full animate-pulse rounded bg-surface" />
        ))}
      </div>
      <span className="sr-only">Carregando treinos…</span>
    </div>
  );
}
