import type { TrainingFormValues } from "@/lib/training-schema";

type MobilePreviewProps = {
  values: TrainingFormValues;
  demoVideoUrl: string | null;
};

/**
 * Espelha, ao vivo, como o treino aparece no app (`app/src/app/trilha/treino/[id].tsx`):
 * título, meta (duração/nível), resumo, vídeo (quando houver), aprendizados e
 * frase do coach, na mesma ordem visual da tela mobile. `TrainingEditor`
 * mantém os valores atualizados via `watch` do formulário (B5).
 */
export function MobilePreview({ values, demoVideoUrl }: MobilePreviewProps) {
  const durationLabel = Number.isFinite(values.durationMinutes)
    ? `${values.durationMinutes} min`
    : "-- min";

  return (
    <section
      aria-label="Pré-visualização no app"
      className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-border bg-background p-4 lg:max-w-none"
    >
      <h2 className="font-display text-base font-semibold text-text">
        Pré-visualização no app
      </h2>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-bold text-text wrap-anywhere">
            {values.title || "Título do treino"}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{durationLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{values.levelLabel || "Nível"}</span>
          </div>
          <p className="text-sm text-text-muted">{values.summary}</p>
        </div>

        {demoVideoUrl && (
          <video
            controls
            preload="metadata"
            src={demoVideoUrl}
            className="w-full rounded-md"
          />
        )}

        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">
            O que você vai aprender
          </h4>
          <ol className="flex flex-col gap-1 text-sm text-text">
            {values.learnings.map((item, index) => (
              <li key={index}>{item.value}</li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-3">
          <span className="text-xs uppercase tracking-wide text-primary">
            Papo do Coach
          </span>
          <p className="text-sm text-text italic">
            {`“${values.coach.quote}”`}
          </p>
          <p className="text-xs text-text-muted">{values.coach.author}</p>
        </div>
      </div>
    </section>
  );
}
