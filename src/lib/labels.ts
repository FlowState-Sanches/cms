import type { EventAction, PillarKey, TrainingStatus } from "./api/schemas";

/** Rótulos PT-BR para status de treino (Contrato CMS). */
export const STATUS_LABELS: Record<TrainingStatus, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
};

/** Rótulos PT-BR para as ações do histórico de eventos do treino. */
export const ACTION_LABELS: Record<EventAction, string> = {
  created: "Criado",
  updated: "Atualizado",
  submitted: "Enviado para revisão",
  returned: "Devolvido",
  published: "Publicado",
  unpublished: "Despublicado",
  archived: "Arquivado",
  reordered: "Reordenado",
  video_attached: "Vídeo anexado",
  video_removed: "Vídeo removido",
  unarchived: "Desarquivado",
};

/** Ordem fixa de exibição dos pilares nas abas da lista. */
export const PILLAR_ORDER: PillarKey[] = [
  "tecnico",
  "fisico",
  "psiquico",
  "flow",
];

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Formata uma data ISO (UTC) no padrão pt-BR `dd/mm/aaaa`. */
export function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(isoDate));
}

/**
 * Formata um timestamp ISO no fuso `America/Sao_Paulo` (H6), padrão pt-BR
 * `dd/mm/aaaa hh:mm`. Usar para timestamps reais (`createdAt`, admin desde),
 * nunca para datas de relógio de parede (`formatDate` continua para essas).
 */
export function formatTimestamp(isoTimestamp: string): string {
  return TIMESTAMP_FORMATTER.format(new Date(isoTimestamp)).replace(", ", " ");
}
