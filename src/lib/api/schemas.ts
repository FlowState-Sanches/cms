import { z } from "zod";

// Enums do Contrato CMS (base: /api/v1/cms/trilha).

export const pillarKeySchema = z.enum([
  "tecnico",
  "fisico",
  "psiquico",
  "flow",
]);
export type PillarKey = z.infer<typeof pillarKeySchema>;

export const trainingStatusSchema = z.enum([
  "draft",
  "review",
  "published",
  "archived",
]);
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;

export const eventActionSchema = z.enum([
  "created",
  "updated",
  "submitted",
  "returned",
  "published",
  "unpublished",
  "archived",
  "reordered",
  "video_attached",
  "video_removed",
]);
export type EventAction = z.infer<typeof eventActionSchema>;

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Person = z.infer<typeof personSchema>;

/**
 * Limites de validação do Contrato CMS (idênticos ao DTO da API). Fonte única
 * para `trainingInputSchema` e para o schema do formulário
 * (`src/lib/training-schema.ts`), que só acrescenta mensagens PT-BR.
 */
export const TRAINING_LIMITS = {
  code: { pattern: /^[A-Za-z0-9]{1,10}$/, max: 10 },
  title: { min: 3, max: 80 },
  subtitle: { min: 1, max: 80 },
  levelLabel: { min: 1, max: 40 },
  durationMinutes: { min: 1, max: 240 },
  summary: { min: 10, max: 600 },
  learnings: { minItems: 1, maxItems: 8, min: 3, max: 200 },
  coachQuote: { min: 3, max: 400 },
  coachAuthor: { min: 2, max: 80 },
  unlockHint: { min: 1, max: 80 },
  selfAssessment: { minItems: 1, maxItems: 6, min: 3, max: 200 },
  referenceTitle: { min: 1, max: 120 },
  referenceProvider: { min: 1, max: 80 },
  referenceUrl: { max: 500 },
  giveBackComment: { min: 3, max: 1000 },
} as const;

const L = TRAINING_LIMITS;

export const referenceSchema = z.object({
  title: z.string().trim().min(L.referenceTitle.min).max(L.referenceTitle.max),
  provider: z
    .string()
    .trim()
    .min(L.referenceProvider.min)
    .max(L.referenceProvider.max),
  url: z.url({ protocol: /^https$/ }).max(L.referenceUrl.max),
});
export type Reference = z.infer<typeof referenceSchema>;

/**
 * `reference` como a API devolve em respostas (`GET /treinos/:id` etc). Os
 * limites de `referenceSchema` valem só para o que o CMS envia (form/input):
 * registros já existentes podem ter título mais longo ou `url` `http://`
 * (dado legado), e não é papel do parse de resposta rejeitar isso.
 */
export const referenceResponseSchema = z.object({
  title: z.string(),
  provider: z.string(),
  url: z.string(),
});
export type ReferenceResponse = z.infer<typeof referenceResponseSchema>;

// GET /acesso
export const cmsAccessSchema = z.object({
  canEdit: z.boolean(),
  canCurate: z.boolean(),
  user: personSchema,
});
export type CmsAccess = z.infer<typeof cmsAccessSchema>;

// GET /pilares
export const cmsPillarSchema = z.object({
  key: pillarKeySchema,
  label: z.string(),
  title: z.string(),
  counts: z.record(trainingStatusSchema, z.number()),
});
export type CmsPillar = z.infer<typeof cmsPillarSchema>;

// GET /treinos (lista)
export const cmsTrainingListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  pillar: pillarKeySchema,
  order: z.number(),
  title: z.string(),
  levelLabel: z.string(),
  status: trainingStatusSchema,
  author: personSchema.nullable(),
  hasVideo: z.boolean(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});
export type CmsTrainingListItem = z.infer<typeof cmsTrainingListItemSchema>;

export const cmsTrainingListSchema = z.object({
  items: z.array(cmsTrainingListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CmsTrainingList = z.infer<typeof cmsTrainingListSchema>;

// GET /treinos/:id e resposta das mutações
export const cmsTrainingEventSchema = z.object({
  id: z.string(),
  action: eventActionSchema,
  comment: z.string().nullable(),
  actor: personSchema.nullable(),
  createdAt: z.string(),
});
export type CmsTrainingEvent = z.infer<typeof cmsTrainingEventSchema>;

export const cmsTrainingSchema = z.object({
  id: z.string(),
  code: z.string(),
  pillar: pillarKeySchema,
  order: z.number(),
  title: z.string(),
  subtitle: z.string(),
  levelLabel: z.string(),
  durationMinutes: z.number(),
  summary: z.string(),
  learnings: z.array(z.string()),
  coach: z.object({
    quote: z.string(),
    author: z.string(),
  }),
  unlockHint: z.string(),
  selfAssessment: z.array(z.string()),
  reference: referenceResponseSchema.nullable(),
  status: trainingStatusSchema,
  version: z.number(),
  publishedAt: z.string().nullable(),
  reviewComment: z.string().nullable(),
  author: personSchema.nullable(),
  hasCompletions: z.boolean(),
  hasVideo: z.boolean(),
  demoVideoUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  events: z.array(cmsTrainingEventSchema),
});
export type CmsTraining = z.infer<typeof cmsTrainingSchema>;

// Body de POST /treinos e PATCH /treinos/:id
export const trainingInputSchema = z.object({
  pillar: pillarKeySchema,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(L.code.pattern, "Código deve ter de 1 a 10 letras ou números."),
  title: z.string().trim().min(L.title.min).max(L.title.max),
  subtitle: z.string().trim().min(L.subtitle.min).max(L.subtitle.max),
  levelLabel: z.string().trim().min(L.levelLabel.min).max(L.levelLabel.max),
  durationMinutes: z
    .number()
    .int()
    .min(L.durationMinutes.min)
    .max(L.durationMinutes.max),
  summary: z.string().trim().min(L.summary.min).max(L.summary.max),
  learnings: z
    .array(z.string().trim().min(L.learnings.min).max(L.learnings.max))
    .min(L.learnings.minItems)
    .max(L.learnings.maxItems),
  coach: z.object({
    quote: z.string().trim().min(L.coachQuote.min).max(L.coachQuote.max),
    author: z.string().trim().min(L.coachAuthor.min).max(L.coachAuthor.max),
  }),
  unlockHint: z.string().trim().min(L.unlockHint.min).max(L.unlockHint.max),
  selfAssessment: z
    .array(
      z.string().trim().min(L.selfAssessment.min).max(L.selfAssessment.max),
    )
    .min(L.selfAssessment.minItems)
    .max(L.selfAssessment.maxItems),
  reference: referenceSchema.nullable(),
});
export type TrainingInput = z.infer<typeof trainingInputSchema>;

export const trainingUpdateInputSchema = trainingInputSchema
  .omit({ pillar: true })
  .partial();
export type TrainingUpdateInput = z.infer<typeof trainingUpdateInputSchema>;

// POST /treinos/:id/devolver
export const giveBackInputSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(L.giveBackComment.min)
    .max(L.giveBackComment.max),
});
export type GiveBackInput = z.infer<typeof giveBackInputSchema>;

// PATCH /pilares/:key/ordem
export const reorderInputSchema = z.object({
  ids: z.array(z.string()),
});
export type ReorderInput = z.infer<typeof reorderInputSchema>;

// POST /treinos/:id/video/upload-url
export const videoUploadUrlResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
  expiresIn: z.number(),
  headers: z.record(z.string(), z.string()),
});
export type VideoUploadUrlResponse = z.infer<
  typeof videoUploadUrlResponseSchema
>;

// POST /auth/login
// Mantido permissivo de propósito: a API já devolve mais campos em `user`
// (roles, activeRole, etc.) que o CMS não usa hoje. Exigimos só o essencial
// e repassamos o resto com `passthrough`.
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .loose(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
