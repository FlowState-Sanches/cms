import { z } from "zod";
import { ApiError, messageFor } from "./api/errors";

/** Resultado das Server Actions de gestão. */
export type AdminActionResult = { ok: true } | { ok: false; error: string };

/** Lista de cada tipo de pessoa no CMS (usada para revalidar lista e detalhe). */
export const PERSON_PATHS = {
  professor: "/professores",
  aluno: "/alunos",
  fotografo: "/fotografos",
} as const;
export type PersonKind = keyof typeof PERSON_PATHS;
export const personKindSchema = z.enum(["professor", "aluno", "fotografo"]);

/** Ids de usuário e de mídia são uuid no banco. */
export const entityIdSchema = z.uuid();

export const INVALID_REQUEST =
  "Não foi possível concluir. Recarregue a página e tente de novo.";
const FORBIDDEN = "Sua conta não tem permissão para esta ação.";
const REJECTED =
  "A API recusou os dados enviados. Recarregue a página e tente de novo.";

/**
 * Só `ApiError` vira mensagem de UI. O resto (NEXT_REDIRECT do 401, resposta
 * fora do schema, rede) é relançado para a fronteira de erro.
 */
export function adminFailure(error: unknown): { ok: false; error: string } {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.status === 403 && !error.code) {
    return { ok: false, error: FORBIDDEN };
  }
  if (error.status === 400 && !error.code) {
    return { ok: false, error: REJECTED };
  }
  return { ok: false, error: messageFor(error) };
}
