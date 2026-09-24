import { z } from "zod";
import {
  pillarKeySchema,
  TRAINING_LIMITS as L,
  type CmsTraining,
  type PillarKey,
  type TrainingInput,
} from "./api/schemas";

/**
 * Schema do formulário de treino. Mesmos limites do Contrato CMS
 * (`TRAINING_LIMITS`), com mensagens PT-BR e dois ajustes de forma:
 *
 * - listas (`learnings`, `selfAssessment`) são `{ value }[]`, porque
 *   `useFieldArray` do React Hook Form só trabalha com arrays de objetos;
 * - `reference` tem `enabled` (checkbox "Incluir referência externa"); os
 *   outros campos só são validados quando `enabled` é `true`.
 *
 * Nenhuma transformação muda o tipo (só `trim`/caixa alta), então entrada e
 * saída do schema têm o mesmo formato e o servidor pode revalidar o mesmo
 * objeto que o cliente enviou.
 */

function lengthMessage(min: number, max: number): string {
  return min <= 1
    ? `Use até ${max} caracteres.`
    : `Use de ${min} a ${max} caracteres.`;
}

function text(
  limits: { min: number; max: number },
  requiredMessage = "Preencha este campo.",
) {
  return z
    .string()
    .trim()
    .min(
      limits.min,
      limits.min <= 1 ? requiredMessage : lengthMessage(limits.min, limits.max),
    )
    .max(limits.max, lengthMessage(limits.min, limits.max));
}

function listOf(
  limits: { minItems: number; maxItems: number; min: number; max: number },
  countMessage: string,
) {
  return z
    .array(z.object({ value: text(limits) }))
    .min(limits.minItems, countMessage)
    .max(limits.maxItems, countMessage);
}

const DURATION_MESSAGE = `Informe a duração em minutos, de ${L.durationMinutes.min} a ${L.durationMinutes.max}.`;

const referenceFormSchema = z.discriminatedUnion("enabled", [
  z.object({
    enabled: z.literal(true),
    title: text(L.referenceTitle, "Informe o título da referência."),
    provider: text(L.referenceProvider, "Informe a fonte da referência."),
    url: z
      .string()
      .trim()
      .min(1, "Informe o link da referência.")
      .max(L.referenceUrl.max, `Use até ${L.referenceUrl.max} caracteres.`)
      .pipe(z.url({ protocol: /^https$/, error: "Use um link https." })),
  }),
  z.object({
    enabled: z.literal(false),
    title: z.string(),
    provider: z.string(),
    url: z.string(),
  }),
]);

export const trainingFormSchema = z.object({
  pillar: pillarKeySchema,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(L.code.pattern, "Use de 1 a 10 letras ou números, sem espaços."),
  title: text(L.title),
  subtitle: text(L.subtitle),
  levelLabel: text(L.levelLabel),
  durationMinutes: z
    .number({ error: DURATION_MESSAGE })
    .int(DURATION_MESSAGE)
    .min(L.durationMinutes.min, DURATION_MESSAGE)
    .max(L.durationMinutes.max, DURATION_MESSAGE),
  summary: text(L.summary),
  learnings: listOf(
    L.learnings,
    `Inclua de ${L.learnings.minItems} a ${L.learnings.maxItems} aprendizados.`,
  ),
  coach: z.object({
    quote: text(L.coachQuote),
    author: text(L.coachAuthor),
  }),
  unlockHint: text(L.unlockHint),
  selfAssessment: listOf(
    L.selfAssessment,
    `Inclua de ${L.selfAssessment.minItems} a ${L.selfAssessment.maxItems} perguntas.`,
  ),
  reference: referenceFormSchema,
});

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;

/** Id de treino: mesmo padrão de slug que a API aceita (`SLUG_PATTERN`). */
export const trainingIdSchema = z.string().regex(/^[a-z0-9-]{1,60}$/);

/** Converte valores do formulário no body do Contrato. Referência desativada vira `null`. */
export function toTrainingInput(values: TrainingFormValues): TrainingInput {
  return {
    pillar: values.pillar,
    code: values.code.trim().toUpperCase(),
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    levelLabel: values.levelLabel.trim(),
    durationMinutes: values.durationMinutes,
    summary: values.summary.trim(),
    learnings: values.learnings.map((item) => item.value.trim()),
    coach: {
      quote: values.coach.quote.trim(),
      author: values.coach.author.trim(),
    },
    unlockHint: values.unlockHint.trim(),
    selfAssessment: values.selfAssessment.map((item) => item.value.trim()),
    reference: values.reference.enabled
      ? {
          title: values.reference.title.trim(),
          provider: values.reference.provider.trim(),
          url: values.reference.url.trim(),
        }
      : null,
  };
}

/** Valores iniciais do formulário de edição a partir do treino da API. */
export function fromTraining(training: CmsTraining): TrainingFormValues {
  return {
    pillar: training.pillar,
    code: training.code,
    title: training.title,
    subtitle: training.subtitle,
    levelLabel: training.levelLabel,
    durationMinutes: training.durationMinutes,
    summary: training.summary,
    learnings: training.learnings.map((value) => ({ value })),
    coach: { quote: training.coach.quote, author: training.coach.author },
    unlockHint: training.unlockHint,
    selfAssessment: training.selfAssessment.map((value) => ({ value })),
    reference: training.reference
      ? { enabled: true, ...training.reference }
      : { enabled: false, title: "", provider: "", url: "" },
  };
}

/**
 * Formulário vazio de criação. `durationMinutes` começa como `NaN`: o input
 * numérico mostra vazio e o schema cobra a duração no envio.
 */
export function emptyTrainingForm(pillar: PillarKey): TrainingFormValues {
  return {
    pillar,
    code: "",
    title: "",
    subtitle: "",
    levelLabel: "",
    durationMinutes: Number.NaN,
    summary: "",
    learnings: [{ value: "" }],
    coach: { quote: "", author: "" },
    unlockHint: "",
    selfAssessment: [{ value: "" }],
    reference: { enabled: false, title: "", provider: "", url: "" },
  };
}
