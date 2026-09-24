"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cmsApi } from "@/lib/api/client";
import { ApiError, ERROR_MESSAGES, messageFor } from "@/lib/api/errors";
import {
  giveBackInputSchema,
  pillarKeySchema,
  TRAINING_LIMITS,
  type PillarKey,
} from "@/lib/api/schemas";
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_MB } from "@/lib/upload";
import {
  toTrainingInput,
  trainingFormSchema,
  trainingIdSchema,
  type TrainingFormValues,
} from "@/lib/training-schema";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type VideoUploadActionResult =
  | {
      ok: true;
      uploadUrl: string;
      key: string;
      expiresIn: number;
      headers: Record<string, string>;
    }
  | { ok: false; error: string };

type TransitionKey = "submeter" | "publicar" | "despublicar" | "arquivar";

const transitionSchema = z.enum([
  "submeter",
  "publicar",
  "despublicar",
  "arquivar",
]);

const reorderActionInputSchema = z.object({
  pillar: pillarKeySchema,
  ids: z.array(trainingIdSchema).min(1),
});

const INVALID_FORM = "Revise os campos destacados.";
const INVALID_REQUEST =
  "Não foi possível concluir. Recarregue a página e tente de novo.";

const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const videoContentTypeSchema = z.enum(ACCEPTED_VIDEO_TYPES);

/**
 * Mensagem específica do fluxo de vídeo para `STORAGE_NOT_CONFIGURED`: mais
 * clara que a mensagem genérica de `ERROR_MESSAGES` (que fica para outros
 * usos futuros do mesmo código de erro).
 */
const STORAGE_NOT_CONFIGURED_MESSAGE =
  "Upload de vídeo indisponível neste ambiente (armazenamento não configurado).";

/**
 * Server Actions do CMS. Cada uma é um endpoint POST público: revalida tudo
 * no servidor (nunca confia no que o cliente validou) antes de chamar a API,
 * que continua sendo quem autoriza.
 *
 * Tratamento de erro:
 * - só `ApiError` vira `ActionResult`; qualquer outra exceção (incluindo o
 *   `NEXT_REDIRECT` que `authedRequest` lança no 401) é relançada;
 * - erros de campo (`fieldErrors`) vêm só da validação Zod local. O 400 do
 *   ValidationPipe da API (mensagens do class-validator, em inglês) vira
 *   mensagem geral;
 * - `redirect()` fica fora de `try/catch`.
 */

function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function failure(error: unknown): ActionResult {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.status === 400 && !error.code) {
    return {
      ok: false,
      error:
        "A API recusou os dados enviados. Revise os campos e tente de novo.",
    };
  }
  if (error.code === "CODE_TAKEN") {
    return {
      ok: false,
      error: messageFor(error),
      fieldErrors: { code: messageFor(error) },
    };
  }
  return { ok: false, error: messageFor(error) };
}

function revalidateTraining(id: string): void {
  revalidatePath("/treinos");
  revalidatePath(`/treinos/${id}`);
}

export async function createTrainingAction(
  values: TrainingFormValues,
): Promise<ActionResult> {
  const parsed = trainingFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: INVALID_FORM,
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  let id: string;
  try {
    const created = await cmsApi.create(toTrainingInput(parsed.data));
    id = created.id;
  } catch (error) {
    return failure(error);
  }

  revalidateTraining(id);
  redirect(`/treinos/${id}`);
}

export async function updateTrainingAction(
  id: string,
  values: TrainingFormValues,
): Promise<ActionResult> {
  if (!trainingIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }
  const parsed = trainingFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: INVALID_FORM,
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  // O pilar não muda depois de criado: fica fora do PATCH.
  const { pillar: _pillar, ...input } = toTrainingInput(parsed.data);
  void _pillar;

  try {
    await cmsApi.update(id, input);
  } catch (error) {
    return failure(error);
  }

  revalidateTraining(id);
  return { ok: true, id };
}

export async function transitionAction(
  id: string,
  action: TransitionKey,
): Promise<ActionResult> {
  if (
    !trainingIdSchema.safeParse(id).success ||
    !transitionSchema.safeParse(action).success
  ) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await cmsApi.transition(id, action);
  } catch (error) {
    return failure(error);
  }

  revalidateTraining(id);
  return { ok: true, id };
}

export async function giveBackAction(
  id: string,
  comment: string,
): Promise<ActionResult> {
  if (!trainingIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }
  const parsed = giveBackInputSchema.safeParse({ comment });
  if (!parsed.success) {
    const { min, max } = TRAINING_LIMITS.giveBackComment;
    const message = `Escreva um comentário de ${min} a ${max} caracteres.`;
    return { ok: false, error: message, fieldErrors: { comment: message } };
  }

  try {
    await cmsApi.giveBack(id, parsed.data.comment);
  } catch (error) {
    return failure(error);
  }

  revalidateTraining(id);
  return { ok: true, id };
}

/**
 * Como `failure`, mas com a mensagem específica de vídeo para
 * `STORAGE_NOT_CONFIGURED`. Usada pelas três Server Actions de vídeo.
 */
function videoFailure(error: unknown): { ok: false; error: string } {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.code === "STORAGE_NOT_CONFIGURED") {
    return { ok: false, error: STORAGE_NOT_CONFIGURED_MESSAGE };
  }
  // INVALID_VIDEO: a mensagem da API traz o limite real configurado no
  // ambiente (pode divergir de MAX_VIDEO_MB, que é só a pré-checagem local).
  // Preferimos a mensagem da API quando ela vier preenchida.
  if (error.code === "INVALID_VIDEO" && error.message) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: messageFor(error) };
}

/**
 * Pede à API a URL assinada de upload. Revalida tipo e tamanho no servidor
 * (o cliente já valida antes de chegar aqui, mas nunca confiamos só nisso).
 */
export async function requestVideoUploadAction(
  id: string,
  contentType: string,
  size: number,
): Promise<VideoUploadActionResult> {
  if (!trainingIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }
  if (
    !videoContentTypeSchema.safeParse(contentType).success ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > MAX_VIDEO_BYTES
  ) {
    return {
      ok: false,
      error: ERROR_MESSAGES.INVALID_VIDEO ?? INVALID_REQUEST,
    };
  }

  try {
    const result = await cmsApi.videoUploadUrl(id, contentType, size);
    return { ok: true, ...result };
  } catch (error) {
    return videoFailure(error);
  }
}

/** Confirma o vídeo já enviado ao S3 (o `key` devolvido por `requestVideoUploadAction`). */
export async function confirmVideoAction(
  id: string,
  key: string,
): Promise<ActionResult> {
  if (
    !trainingIdSchema.safeParse(id).success ||
    typeof key !== "string" ||
    key.length === 0
  ) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await cmsApi.confirmVideo(id, key);
  } catch (error) {
    return videoFailure(error);
  }

  revalidateTraining(id);
  return { ok: true, id };
}

/** Remove o vídeo de demonstração do treino. */
export async function removeVideoAction(id: string): Promise<ActionResult> {
  if (!trainingIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await cmsApi.removeVideo(id);
  } catch (error) {
    return videoFailure(error);
  }

  revalidateTraining(id);
  return { ok: true, id };
}

/**
 * Salva a nova ordem de um pilar (só curadoria, ver matriz de permissão). A
 * API exige a lista completa dos treinos não arquivados do pilar, na nova
 * ordem: se faltar, sobrar ou trocar de pilar um id, responde 400
 * `INVALID_ORDER` e não grava nada (Review Focus 3).
 */
export async function reorderAction(
  pillar: PillarKey,
  ids: string[],
): Promise<ActionResult> {
  const parsed = reorderActionInputSchema.safeParse({ pillar, ids });
  if (!parsed.success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await cmsApi.reorder(parsed.data.pillar, parsed.data.ids);
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/treinos");
  revalidatePath(`/pilares/${pillar}/ordem`);
  return { ok: true };
}

export async function deleteTrainingAction(id: string): Promise<ActionResult> {
  if (!trainingIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await cmsApi.remove(id);
  } catch (error) {
    return failure(error);
  }

  revalidateTraining(id);
  redirect("/treinos");
}
