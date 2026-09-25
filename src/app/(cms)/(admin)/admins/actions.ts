"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminApi } from "@/lib/api/admin-client";
import { ApiError } from "@/lib/api/errors";
import {
  adminFailure,
  entityIdSchema,
  INVALID_REQUEST,
  type AdminActionResult,
} from "@/lib/admin-action";

export type GrantAdminState =
  | { ok: true; message: string }
  | { ok: false; error: string; email: string; fieldError?: string }
  | null;

const emailSchema = z.email();
const INVALID_EMAIL = "Informe um e-mail válido.";
const EMAIL_NOT_FOUND = "Nenhuma conta encontrada com esse e-mail.";

/**
 * Concede `admin` a um usuário existente, localizado por e-mail (G3). As
 * travas (já admin, conta inexistente) e a auditoria ficam na API.
 */
export async function grantAdminAction(
  _prev: GrantAdminState,
  formData: FormData,
): Promise<GrantAdminState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw : "";
  const normalized = email.trim().toLowerCase();
  if (!emailSchema.safeParse(normalized).success) {
    return { ok: false, error: INVALID_EMAIL, email, fieldError: INVALID_EMAIL };
  }

  let name: string;
  try {
    const admin = await adminApi.grantAdmin(normalized);
    name = admin.name;
  } catch (error) {
    if (error instanceof ApiError && error.code === "USER_NOT_FOUND") {
      return { ok: false, error: EMAIL_NOT_FOUND, email, fieldError: EMAIL_NOT_FOUND };
    }
    const failure = adminFailure(error);
    // Problemas da conta indicada pelo e-mail ficam ligados ao campo.
    if (
      error instanceof ApiError &&
      (error.code === "ALREADY_ADMIN" || error.code === "USER_BLOCKED")
    ) {
      return { ...failure, email, fieldError: failure.error };
    }
    return { ...failure, email };
  }

  revalidatePath("/admins");
  revalidatePath("/painel");
  return { ok: true, message: `${name} agora é admin.` };
}

/**
 * Revoga `admin`. A API recusa revogar a si mesmo (`CANNOT_TARGET_SELF`) e
 * o último admin (`LAST_ADMIN`, com `SELECT ... FOR UPDATE`).
 */
export async function revokeAdminAction(id: string): Promise<AdminActionResult> {
  if (!entityIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await adminApi.revokeAdmin(id);
  } catch (error) {
    return adminFailure(error);
  }

  revalidatePath("/admins");
  revalidatePath("/painel");
  return { ok: true };
}
