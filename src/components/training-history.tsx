import type { CmsTrainingEvent } from "@/lib/api/schemas";
import { ACTION_LABELS, formatDate } from "@/lib/labels";

type TrainingHistoryProps = {
  events: CmsTrainingEvent[];
};

/** Histórico do treino (20 eventos mais recentes, já em ordem decrescente pela API). */
export function TrainingHistory({ events }: TrainingHistoryProps) {
  return (
    <section aria-labelledby="historico-titulo" className="flex flex-col gap-3">
      <h2
        id="historico-titulo"
        className="font-display text-base font-semibold text-text"
      >
        Histórico
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-text-muted">Nenhum evento registrado.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-0.5 border-l border-border pl-3"
            >
              <p className="text-sm font-medium text-text">
                {ACTION_LABELS[event.action]}
              </p>
              <p className="text-xs text-text-muted">
                {event.actor?.name ?? "Sistema"} em{" "}
                <time dateTime={event.createdAt}>
                  {formatDate(event.createdAt)}
                </time>
              </p>
              {event.comment && (
                <p className="whitespace-pre-line text-sm text-text">
                  {event.comment}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
