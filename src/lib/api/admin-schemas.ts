import { z } from "zod";

/**
 * Respostas de `/api/v1/cms/*` (gestão operacional, spec
 * 2026-09-24-cms-gestao-design.md §4.3). `z.object` descarta campo a mais,
 * então a API pode crescer sem quebrar o CMS; campo faltando ou renomeado
 * vira "Resposta inesperada da API" em `apiRequest` (defeito de contrato,
 * cai no error.tsx em vez de renderizar `undefined`).
 */

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const countSchema = z.number().int().nonnegative();

export const personRefSchema = z.object({ id: z.string(), name: z.string() });
export type PersonRef = z.infer<typeof personRefSchema>;

export const studentPlanSchema = z.enum(["free", "paid"]);
export type StudentPlan = z.infer<typeof studentPlanSchema>;

export const personStatusSchema = z.enum(["active", "blocked"]);
export type PersonStatus = z.infer<typeof personStatusSchema>;

export const mediaTypeSchema = z.enum(["photo", "video"]);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const mediaStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "failed",
]);
export type MediaStatus = z.infer<typeof mediaStatusSchema>;

export const lessonStatusSchema = z.enum(["confirmed", "cancelled"]);
export type LessonStatus = z.infer<typeof lessonStatusSchema>;

function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: countSchema,
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
  });
}

// GET dashboard/summary
export const dashboardSummarySchema = z.object({
  people: z.object({
    students: z.object({ total: countSchema, paid: countSchema }),
    professors: z.object({ total: countSchema, verified: countSchema }),
    photographers: z.object({ total: countSchema }),
    admins: z.object({ total: countSchema }),
    blocked: z.object({ total: countSchema }),
  }),
  lessons: z.object({
    today: countSchema,
    next7Days: countSchema,
    thisMonth: countSchema,
    cancelledThisMonth: countSchema,
  }),
  groupClasses: z.object({ upcoming: countSchema }),
  events: z.object({ upcoming: countSchema }),
  media: z.object({
    today: z.object({ photos: countSchema, videos: countSchema }),
  }),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// GET calendar?from&to
export const calendarDaySchema = z.object({
  date: isoDateSchema,
  lessons: countSchema,
  groupClasses: countSchema,
  events: countSchema,
  sessions: countSchema,
  photos: countSchema,
  videos: countSchema,
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;

export const calendarMonthSchema = z.object({
  days: z.array(calendarDaySchema),
});
export type CalendarMonth = z.infer<typeof calendarMonthSchema>;

// GET calendar/day?date
export const agendaLessonSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  professor: personRefSchema,
  student: personRefSchema,
});
export type AgendaLesson = z.infer<typeof agendaLessonSchema>;

export const agendaGroupEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["aula_grupo", "evento"]),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  professor: personRefSchema,
  maxSpots: countSchema,
  takenSpots: countSchema,
});
export type AgendaGroupEvent = z.infer<typeof agendaGroupEventSchema>;

export const agendaSessionSchema = z.object({
  id: z.string(),
  location: z.string(),
  startTime: z.string().nullable(),
  photographer: personRefSchema,
  photoCount: countSchema,
  videoCount: countSchema,
  coverUrl: z.string().nullable(),
});
export type AgendaSession = z.infer<typeof agendaSessionSchema>;

export const calendarDayDetailSchema = z.object({
  date: isoDateSchema,
  lessons: z.array(agendaLessonSchema),
  groupClasses: z.array(agendaGroupEventSchema),
  events: z.array(agendaGroupEventSchema),
  sessions: z.array(agendaSessionSchema),
});
export type CalendarDayDetail = z.infer<typeof calendarDayDetailSchema>;

// Pessoas
const personBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  blocked: z.boolean(),
  createdAt: z.string(),
});

export const studentListItemSchema = personBaseSchema.extend({
  plan: studentPlanSchema,
});
export type StudentListItem = z.infer<typeof studentListItemSchema>;
export const studentListSchema = pageOf(studentListItemSchema);
export type StudentList = z.infer<typeof studentListSchema>;

export const studentDetailSchema = studentListItemSchema.extend({
  lessonsCount: countSchema,
  enrollmentsCount: countSchema,
  taggedSessionsCount: countSchema,
  recentLessons: z.array(
    z.object({
      id: z.string(),
      date: isoDateSchema,
      startTime: z.string(),
      professor: personRefSchema,
      status: lessonStatusSchema,
    }),
  ),
});
export type StudentDetail = z.infer<typeof studentDetailSchema>;

export const professorListItemSchema = personBaseSchema.extend({
  verified: z.boolean(),
  lessonsCount: countSchema,
});
export type ProfessorListItem = z.infer<typeof professorListItemSchema>;
export const professorListSchema = pageOf(professorListItemSchema);
export type ProfessorList = z.infer<typeof professorListSchema>;

export const professorDetailSchema = professorListItemSchema.extend({
  // null quando o professor nunca salvou perfil (professor_profiles sem linha).
  profile: z
    .object({
      bio: z.string().nullable(),
      location: z.string().nullable(),
      specialties: z.array(z.string()),
      pricePerHour: z.number().nullable(),
    })
    .nullable(),
  upcomingLessons: countSchema,
  groupEventsCount: countSchema,
  rating: z.object({ average: z.number().nullable(), count: countSchema }),
});
export type ProfessorDetail = z.infer<typeof professorDetailSchema>;

export const photographerListItemSchema = personBaseSchema.extend({
  sessionsCount: countSchema,
  photosCount: countSchema,
  videosCount: countSchema,
});
export type PhotographerListItem = z.infer<typeof photographerListItemSchema>;
export const photographerListSchema = pageOf(photographerListItemSchema);
export type PhotographerList = z.infer<typeof photographerListSchema>;

export const photographerDetailSchema = photographerListItemSchema.extend({
  recentSessions: z.array(
    z.object({
      id: z.string(),
      location: z.string(),
      sessionDate: isoDateSchema,
      photoCount: countSchema,
      videoCount: countSchema,
    }),
  ),
});
export type PhotographerDetail = z.infer<typeof photographerDetailSchema>;

// PATCH users/:id/block | unblock
export const blockResultSchema = z.object({
  id: z.string(),
  blocked: z.boolean(),
});
export type BlockResult = z.infer<typeof blockResultSchema>;

// Admins
export const adminItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  since: z.string().nullable().optional(),
});
export type AdminItem = z.infer<typeof adminItemSchema>;
export const adminListSchema = z.object({ items: z.array(adminItemSchema) });
export type AdminList = z.infer<typeof adminListSchema>;

// Mídias
export const mediaListItemSchema = z.object({
  id: z.string(),
  type: mediaTypeSchema,
  status: mediaStatusSchema,
  thumbnailUrl: z.string().nullable(),
  session: z.object({
    id: z.string(),
    location: z.string(),
    sessionDate: isoDateSchema,
  }),
  photographer: personRefSchema,
  createdAt: z.string(),
});
export type MediaListItem = z.infer<typeof mediaListItemSchema>;
export const mediaListSchema = pageOf(mediaListItemSchema);
export type MediaList = z.infer<typeof mediaListSchema>;

export const mediaDetailSchema = mediaListItemSchema.extend({
  url: z.string().nullable(),
  // `media_assets.size_bytes` é bigint: o driver do Postgres pode serializar como string.
  sizeBytes: z.coerce.number().nonnegative(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  mimeType: z.string(),
  paidOrders: countSchema,
});
export type MediaDetail = z.infer<typeof mediaDetailSchema>;
