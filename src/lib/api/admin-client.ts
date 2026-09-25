import "server-only";
import { z } from "zod";
import { authedRequest } from "./client";
import { buildQuery } from "./query";
import {
  adminItemSchema,
  adminListSchema,
  blockResultSchema,
  calendarDayDetailSchema,
  calendarMonthSchema,
  dashboardSummarySchema,
  mediaDetailSchema,
  mediaListSchema,
  photographerDetailSchema,
  photographerListSchema,
  professorDetailSchema,
  professorListSchema,
  studentDetailSchema,
  studentListSchema,
  type AdminItem,
  type AdminList,
  type BlockResult,
  type CalendarDayDetail,
  type CalendarMonth,
  type DashboardSummary,
  type MediaDetail,
  type MediaList,
  type MediaStatus,
  type MediaType,
  type PersonStatus,
  type PhotographerDetail,
  type PhotographerList,
  type ProfessorDetail,
  type ProfessorList,
  type StudentDetail,
  type StudentList,
  type StudentPlan,
} from "./admin-schemas";

const BASE = "/cms";

function segment(id: string): string {
  return encodeURIComponent(id);
}

type PageQuery = { page?: number; limit?: number };
export type PeopleQuery = PageQuery & { q?: string; status?: PersonStatus };
export type StudentQuery = PeopleQuery & { plan?: StudentPlan };
export type ProfessorQuery = PeopleQuery & { verified?: boolean };
export type MediaQuery = PageQuery & {
  date?: string;
  photographerId?: string;
  type?: MediaType;
  status?: MediaStatus;
};

/**
 * Cliente da gestão operacional (`/api/v1/cms/*`). Roda só no servidor:
 * `authedRequest` lê o token do cookie httpOnly e trata o 401. Quem autoriza
 * é a API (`CmsAdminGuard` lê papel e bloqueio do banco a cada requisição).
 */
export const adminApi = {
  summary: (): Promise<DashboardSummary> =>
    authedRequest(`${BASE}/dashboard/summary`, dashboardSummarySchema),

  calendar: (from: string, to: string): Promise<CalendarMonth> =>
    authedRequest(`${BASE}/calendar${buildQuery({ from, to })}`, calendarMonthSchema),

  calendarDay: (date: string): Promise<CalendarDayDetail> =>
    authedRequest(
      `${BASE}/calendar/day${buildQuery({ date })}`,
      calendarDayDetailSchema,
    ),

  students: (query: StudentQuery): Promise<StudentList> =>
    authedRequest(
      `${BASE}/students${buildQuery({
        q: query.q,
        plan: query.plan,
        status: query.status,
        page: query.page,
        limit: query.limit,
      })}`,
      studentListSchema,
    ),

  student: (id: string): Promise<StudentDetail> =>
    authedRequest(`${BASE}/students/${segment(id)}`, studentDetailSchema),

  professors: (query: ProfessorQuery): Promise<ProfessorList> =>
    authedRequest(
      `${BASE}/professors${buildQuery({
        q: query.q,
        verified: query.verified,
        status: query.status,
        page: query.page,
        limit: query.limit,
      })}`,
      professorListSchema,
    ),

  professor: (id: string): Promise<ProfessorDetail> =>
    authedRequest(`${BASE}/professors/${segment(id)}`, professorDetailSchema),

  setProfessorVerified: (id: string, verified: boolean): Promise<ProfessorDetail> =>
    authedRequest(
      `${BASE}/professors/${segment(id)}/verification`,
      professorDetailSchema,
      { method: "PATCH", body: { verified } },
    ),

  photographers: (query: PeopleQuery): Promise<PhotographerList> =>
    authedRequest(
      `${BASE}/photographers${buildQuery({
        q: query.q,
        status: query.status,
        page: query.page,
        limit: query.limit,
      })}`,
      photographerListSchema,
    ),

  photographer: (id: string): Promise<PhotographerDetail> =>
    authedRequest(`${BASE}/photographers/${segment(id)}`, photographerDetailSchema),

  setBlocked: (id: string, blocked: boolean): Promise<BlockResult> =>
    authedRequest(
      `${BASE}/users/${segment(id)}/${blocked ? "block" : "unblock"}`,
      blockResultSchema,
      { method: "PATCH" },
    ),

  admins: (): Promise<AdminList> =>
    authedRequest(`${BASE}/admins`, adminListSchema),

  grantAdmin: (email: string): Promise<AdminItem> =>
    authedRequest(`${BASE}/admins`, adminItemSchema, {
      method: "POST",
      body: { email },
    }),

  revokeAdmin: (id: string): Promise<void> =>
    authedRequest(`${BASE}/admins/${segment(id)}`, z.void(), {
      method: "DELETE",
    }),

  media: (query: MediaQuery): Promise<MediaList> =>
    authedRequest(
      `${BASE}/media${buildQuery({
        date: query.date,
        photographerId: query.photographerId,
        type: query.type,
        status: query.status,
        page: query.page,
        limit: query.limit,
      })}`,
      mediaListSchema,
    ),

  mediaItem: (id: string): Promise<MediaDetail> =>
    authedRequest(`${BASE}/media/${segment(id)}`, mediaDetailSchema),

  removeMedia: (id: string): Promise<void> =>
    authedRequest(`${BASE}/media/${segment(id)}`, z.void(), {
      method: "DELETE",
    }),
};
