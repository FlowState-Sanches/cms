"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminApi } from "@/lib/api/admin-client";
import {
  adminFailure,
  entityIdSchema,
  INVALID_REQUEST,
  PERSON_PATHS,
  personKindSchema,
  type AdminActionResult,
  type PersonKind,
} from "@/lib/admin-action";

/**
 * Server Actions de pessoas (bloqueio e verificação). Cada uma é um
 * endpoint POST público: revalida a entrada aqui e a API decide
 * (`CmsAdminGuard` lê papel e bloqueio do banco; travas H3 e G3 na API).
 */

const blockInputSchema = z.object({
  kind: personKindSchema,
  id: entityIdSchema,
  blocked: z.boolean(),
});

const verifyInputSchema = z.object({
  id: entityIdSchema,
  verified: z.boolean(),
});

export async function setBlockedAction(
  kind: PersonKind,
  id: string,
  blocked: boolean,
): Promise<AdminActionResult> {
  const parsed = blockInputSchema.safeParse({ kind, id, blocked });
  if (!parsed.success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await adminApi.setBlocked(parsed.data.id, parsed.data.blocked);
  } catch (error) {
    return adminFailure(error);
  }

  const base = PERSON_PATHS[parsed.data.kind];
  revalidatePath(base);
  revalidatePath(`${base}/${parsed.data.id}`);
  revalidatePath("/painel");
  return { ok: true };
}

export async function setVerifiedAction(
  id: string,
  verified: boolean,
): Promise<AdminActionResult> {
  const parsed = verifyInputSchema.safeParse({ id, verified });
  if (!parsed.success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await adminApi.setProfessorVerified(parsed.data.id, parsed.data.verified);
  } catch (error) {
    return adminFailure(error);
  }

  revalidatePath("/professores");
  revalidatePath(`/professores/${parsed.data.id}`);
  revalidatePath("/painel");
  return { ok: true };
}
