import "server-only";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "../env";
import { getSessionToken } from "../session";
import { ApiError } from "./errors";
import {
  cmsAccessSchema,
  cmsPillarSchema,
  cmsTrainingListItemSchema,
  cmsTrainingListSchema,
  cmsTrainingSchema,
  videoUploadUrlResponseSchema,
  type CmsAccess,
  type CmsPillar,
  type CmsTraining,
  type CmsTrainingList,
  type CmsTrainingListItem,
  type PillarKey,
  type TrainingInput,
  type TrainingStatus,
  type VideoUploadUrlResponse,
} from "./schemas";

type ApiRequestInit = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

function extractMessage(body: unknown): string | null {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
    if (Array.isArray(message)) {
      const joined = message.filter((item): item is string => typeof item === "string").join(" ");
      return joined || null;
    }
  }
  return null;
}

function extractCode(body: unknown): string | null {
  if (body && typeof body === "object" && "code" in body) {
    const code = (body as { code: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return null;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const message = extractMessage(body) ?? response.statusText ?? "Erro inesperado.";
  const code = extractCode(body);
  return new ApiError(response.status, message, code);
}

/**
 * Cliente HTTP base para a API. Roda só no servidor (Server Components,
 * Server Actions, Route Handlers): o token nunca chega ao navegador.
 */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: ApiRequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init?.token) {
    headers.Authorization = `Bearer ${init.token}`;
  }

  const response = await fetch(`${env().API_BASE_URL}${path}`, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return schema.parse(undefined);
  }

  const json: unknown = await response.json().catch(() => undefined);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Resposta inesperada da API");
  }
  return parsed.data;
}

/**
 * Como `apiRequest`, mas lê o token da sessão do CMS. Se a API responder 401
 * (sessão expirada ou revogada), redireciona para `/sessao-expirada`, sem
 * deixar o formulário em tela com um erro genérico (Review Focus 5).
 *
 * Importante: aqui NÃO mexemos em cookies. `authedRequest` roda tanto em
 * Server Components (render) quanto em Server Actions/Route Handlers, e o
 * Next 16 lança `ReadonlyRequestCookiesError` se `cookies().delete()` for
 * chamado fora de uma Server Action ou Route Handler. Quem apaga o cookie é
 * `GET /sessao-expirada` (Route Handler), que também redireciona para
 * `/login?expirada=1`.
 */
export async function authedRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: Omit<ApiRequestInit, "token">,
): Promise<T> {
  const token = await getSessionToken();
  try {
    return await apiRequest(path, schema, { ...init, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/sessao-expirada");
    }
    throw error;
  }
}

const BASE_PATH = "/cms/trilha";

function buildQuery(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const cmsApi = {
  access: (): Promise<CmsAccess> => authedRequest(`${BASE_PATH}/acesso`, cmsAccessSchema),

  pillars: (): Promise<CmsPillar[]> =>
    authedRequest(`${BASE_PATH}/pilares`, z.array(cmsPillarSchema)),

  list: (q: {
    pillar?: PillarKey;
    status?: TrainingStatus;
    page?: number;
    limit?: number;
  }): Promise<CmsTrainingList> =>
    authedRequest(
      `${BASE_PATH}/treinos${buildQuery({
        pillar: q.pillar,
        status: q.status,
        page: q.page,
        limit: q.limit,
      })}`,
      cmsTrainingListSchema,
    ),

  detail: (id: string): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}`, cmsTrainingSchema),

  create: (input: TrainingInput): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos`, cmsTrainingSchema, {
      method: "POST",
      body: input,
    }),

  update: (
    id: string,
    input: Partial<Omit<TrainingInput, "pillar">>,
  ): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}`, cmsTrainingSchema, {
      method: "PATCH",
      body: input,
    }),

  transition: (
    id: string,
    action: "submeter" | "publicar" | "despublicar" | "arquivar",
  ): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}/${action}`, cmsTrainingSchema, {
      method: "POST",
    }),

  giveBack: (id: string, comment: string): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}/devolver`, cmsTrainingSchema, {
      method: "POST",
      body: { comment },
    }),

  remove: (id: string): Promise<void> =>
    authedRequest(`${BASE_PATH}/treinos/${id}`, z.void(), { method: "DELETE" }),

  reorder: (pillar: PillarKey, ids: string[]): Promise<CmsTrainingListItem[]> =>
    authedRequest(
      `${BASE_PATH}/pilares/${pillar}/ordem`,
      z.array(cmsTrainingListItemSchema),
      { method: "PATCH", body: { ids } },
    ),

  videoUploadUrl: (
    id: string,
    contentType: string,
    size: number,
  ): Promise<VideoUploadUrlResponse> =>
    authedRequest(
      `${BASE_PATH}/treinos/${id}/video/upload-url`,
      videoUploadUrlResponseSchema,
      { method: "POST", body: { contentType, size } },
    ),

  confirmVideo: (id: string, key: string): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}/video/confirmar`, cmsTrainingSchema, {
      method: "POST",
      body: { key },
    }),

  removeVideo: (id: string): Promise<CmsTraining> =>
    authedRequest(`${BASE_PATH}/treinos/${id}/video`, cmsTrainingSchema, {
      method: "DELETE",
    }),
};
