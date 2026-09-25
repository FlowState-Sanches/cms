import { describe, expect, it } from "vitest";
import {
  adminListSchema,
  agendaSessionSchema,
  calendarDaySchema,
  dashboardSummarySchema,
  mediaDetailSchema,
  photographerDetailSchema,
  studentDetailSchema,
  studentListSchema,
} from "./admin-schemas";

const summary = {
  people: {
    students: { total: 120, paid: 30 },
    professors: { total: 14, verified: 9 },
    photographers: { total: 5 },
    admins: { total: 2 },
    blocked: { total: 1 },
  },
  lessons: { today: 3, next7Days: 18, thisMonth: 40, cancelledThisMonth: 2 },
  groupClasses: { upcoming: 4 },
  events: { upcoming: 1 },
  media: { today: { photos: 40, videos: 2 } },
};

const mediaItem = {
  id: "m1",
  type: "photo",
  status: "ready",
  thumbnailUrl: null,
  session: { id: "s1", location: "Praia Mole", sessionDate: "2026-09-24" },
  photographer: { id: "f1", name: "Fotógrafa E2E" },
  createdAt: "2026-09-24T10:00:00.000Z",
};

describe("admin-schemas", () => {
  it("aceita o resumo do painel da spec", () => {
    expect(dashboardSummarySchema.safeParse(summary).success).toBe(true);
  });

  it("recusa dia do calendário fora do formato YYYY-MM-DD", () => {
    const result = calendarDaySchema.safeParse({
      date: "24/09/2026",
      lessons: 1,
      groupClasses: 0,
      events: 0,
      sessions: 0,
      photos: 0,
      videos: 0,
    });
    expect(result.success).toBe(false);
  });

  it("converte sizeBytes que chega como string (bigint do Postgres)", () => {
    const result = mediaDetailSchema.parse({
      ...mediaItem,
      url: "https://s3.test/assinada",
      sizeBytes: "2048",
      width: 1920,
      height: 1080,
      durationSeconds: null,
      mimeType: "image/jpeg",
      paidOrders: 0,
    });
    expect(result.sizeBytes).toBe(2048);
  });

  it("recusa sizeBytes nulo ou vazio em vez de virar 0", () => {
    const base = {
      ...mediaItem,
      url: "https://s3.test/assinada",
      width: 1920,
      height: 1080,
      durationSeconds: null,
      mimeType: "image/jpeg",
      paidOrders: 0,
    };
    expect(mediaDetailSchema.safeParse({ ...base, sizeBytes: null }).success).toBe(false);
    expect(mediaDetailSchema.safeParse({ ...base, sizeBytes: "" }).success).toBe(false);
  });

  it("recusa item de aluno sem o plano (contrato quebrado) e descarta campo a mais", () => {
    const base = {
      id: "a1",
      name: "Aluno",
      email: "aluno@x.test",
      blocked: false,
      createdAt: "2026-09-01T00:00:00.000Z",
    };
    expect(
      studentListSchema.safeParse({ items: [base], total: 1, page: 1, limit: 20 })
        .success,
    ).toBe(false);

    const parsed = studentListSchema.parse({
      items: [{ ...base, plan: "paid", roles: ["aluno"] }],
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(parsed.items[0]).not.toHaveProperty("roles");
  });

  it("aceita admin sem data de concessão", () => {
    const result = adminListSchema.safeParse({
      items: [{ id: "u1", name: "Admin", email: "admin@x.test" }],
    });
    expect(result.success).toBe(true);
  });

  it("recusa sessão da agenda sem endTime e aceita o contrato completo (CmsCalendarSession)", () => {
    const withoutEndTime = {
      id: "sess1",
      location: "Praia Mole",
      startTime: "09:00",
      photographer: { id: "f1", name: "Fotógrafa E2E" },
      photoCount: 10,
      videoCount: 1,
      coverUrl: null,
    };
    expect(agendaSessionSchema.safeParse(withoutEndTime).success).toBe(false);

    const complete = { ...withoutEndTime, endTime: "10:30" };
    expect(agendaSessionSchema.safeParse(complete).success).toBe(true);
  });

  it("recusa aula recente do aluno sem endTime/location e aceita o contrato completo (CmsStudentLesson)", () => {
    const base = {
      id: "st1",
      name: "Aluno",
      email: "aluno@x.test",
      plan: "paid",
      blocked: false,
      createdAt: "2026-09-01T00:00:00.000Z",
      lessonsCount: 1,
      enrollmentsCount: 0,
      taggedSessionsCount: 0,
    };
    const lessonWithoutFields = {
      id: "l1",
      date: "2026-09-24",
      startTime: "09:00",
      professor: { id: "p1", name: "Professor E2E" },
      status: "confirmed",
    };
    expect(
      studentDetailSchema.safeParse({
        ...base,
        recentLessons: [lessonWithoutFields],
      }).success,
    ).toBe(false);

    const complete = studentDetailSchema.safeParse({
      ...base,
      recentLessons: [
        { ...lessonWithoutFields, endTime: "10:00", location: "Praia Mole" },
      ],
    });
    expect(complete.success).toBe(true);
  });

  it("recusa sessão recente do fotógrafo sem startTime/coverUrl e aceita o contrato completo (CmsPhotographerSession)", () => {
    const base = {
      id: "ph1",
      name: "Fotógrafa",
      email: "foto@x.test",
      blocked: false,
      createdAt: "2026-09-01T00:00:00.000Z",
      sessionsCount: 1,
      photosCount: 10,
      videosCount: 1,
    };
    const sessionWithoutFields = {
      id: "s1",
      location: "Praia Mole",
      sessionDate: "2026-09-24",
      photoCount: 10,
      videoCount: 1,
    };
    expect(
      photographerDetailSchema.safeParse({
        ...base,
        recentSessions: [sessionWithoutFields],
      }).success,
    ).toBe(false);

    const complete = photographerDetailSchema.safeParse({
      ...base,
      recentSessions: [
        { ...sessionWithoutFields, startTime: null, coverUrl: null },
      ],
    });
    expect(complete.success).toBe(true);
  });
});
