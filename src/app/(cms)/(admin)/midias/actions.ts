"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import {
  adminFailure,
  entityIdSchema,
  INVALID_REQUEST,
  type AdminActionResult,
} from "@/lib/admin-action";

/**
 * Remove a mídia (G4). A API recusa com `MEDIA_HAS_PAID_ORDERS` se houver
 * pedido pago; apaga no banco e depois no S3 (§4.5). Sucesso volta para a
 * grade; `redirect` fica fora do try/catch.
 */
export async function removeMediaAction(id: string): Promise<AdminActionResult> {
  if (!entityIdSchema.safeParse(id).success) {
    return { ok: false, error: INVALID_REQUEST };
  }

  try {
    await adminApi.removeMedia(id);
  } catch (error) {
    return adminFailure(error);
  }

  revalidatePath("/midias");
  revalidatePath("/painel");
  redirect("/midias?removida=1");
}
