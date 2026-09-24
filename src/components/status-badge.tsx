import type { TrainingStatus } from "@/lib/api/schemas";
import { STATUS_LABELS } from "@/lib/labels";

const STATUS_STYLES: Record<TrainingStatus, string> = {
  draft: "border-border bg-surface text-text-muted",
  review: "border-accent/40 bg-accent-soft text-accent",
  published: "border-primary/40 bg-primary-soft text-primary",
  archived: "border-danger/40 bg-danger-soft text-danger",
};

type StatusBadgeProps = {
  status: TrainingStatus;
};

/**
 * O rótulo em texto (não só a cor) é o que comunica o status: badge
 * acessível para leitores de tela e para quem tem baixa percepção de cor.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
