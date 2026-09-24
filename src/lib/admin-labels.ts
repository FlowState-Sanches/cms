import type {
  LessonStatus,
  MediaStatus,
  MediaType,
  PersonStatus,
  StudentPlan,
} from "./api/admin-schemas";

/** Opção de filtro em `<select>` (valor da URL, rótulo PT-BR). */
export type FilterOption = { value: string; label: string };

export const PLAN_LABELS: Record<StudentPlan, string> = {
  free: "Gratuito",
  paid: "Pago",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  photo: "Foto",
  video: "Vídeo",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
  pending: "Pendente",
  processing: "Processando",
  ready: "Pronta",
  failed: "Falhou",
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

// Parâmetros de URL (PT-BR) para valores da API (inglês).
export const PERSON_STATUS_PARAM = {
  ativo: "active",
  bloqueado: "blocked",
} as const satisfies Record<string, PersonStatus>;
export const PERSON_STATUS_OPTIONS: FilterOption[] = [
  { value: "ativo", label: "Ativos" },
  { value: "bloqueado", label: "Bloqueados" },
];

export const PLAN_PARAM = {
  gratuito: "free",
  pago: "paid",
} as const satisfies Record<string, StudentPlan>;
export const PLAN_OPTIONS: FilterOption[] = [
  { value: "gratuito", label: "Gratuitos" },
  { value: "pago", label: "Pagos" },
];

export const VERIFICATION_PARAM = { verificado: true, pendente: false } as const;
export const VERIFICATION_OPTIONS: FilterOption[] = [
  { value: "verificado", label: "Verificados" },
  { value: "pendente", label: "Pendentes" },
];

export const MEDIA_TYPE_PARAM = {
  foto: "photo",
  video: "video",
} as const satisfies Record<string, MediaType>;
export const MEDIA_TYPE_OPTIONS: FilterOption[] = [
  { value: "foto", label: "Fotos" },
  { value: "video", label: "Vídeos" },
];

export const MEDIA_STATUS_PARAM = {
  pendente: "pending",
  processando: "processing",
  pronta: "ready",
  falhou: "failed",
} as const satisfies Record<string, MediaStatus>;
export const MEDIA_STATUS_OPTIONS: FilterOption[] = [
  { value: "pronta", label: "Prontas" },
  { value: "processando", label: "Processando" },
  { value: "pendente", label: "Pendentes" },
  { value: "falhou", label: "Com falha" },
];

const INTEGER = new Intl.NumberFormat("pt-BR");
const ONE_DECIMAL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const RATING = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return INTEGER.format(value);
}

/** "1 aula", "3 aulas", "1.200 mídias". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 ** 2) {
    return `${ONE_DECIMAL.format(bytes / 1024)} KB`;
  }
  if (bytes < 1024 ** 3) {
    return `${ONE_DECIMAL.format(bytes / 1024 ** 2)} MB`;
  }
  return `${ONE_DECIMAL.format(bytes / 1024 ** 3)} GB`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes === 0) {
    return `${rest} s`;
  }
  return rest > 0 ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export function formatRating(average: number | null): string {
  return average === null ? "Sem nota" : RATING.format(average);
}
