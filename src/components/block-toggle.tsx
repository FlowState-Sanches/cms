"use client";

import { setBlockedAction } from "@/app/(cms)/(admin)/actions";
import type { PersonKind } from "@/lib/admin-action";
import { ConfirmAction } from "./confirm-action";

type BlockToggleProps = {
  kind: PersonKind;
  userId: string;
  name: string;
  blocked: boolean;
};

/**
 * Bloquear e desbloquear (G2, reversível). A API recusa bloquear admin
 * (`ADMIN_BLOCK_FORBIDDEN`) e a si mesmo (`CANNOT_TARGET_SELF`); a mensagem
 * traduzida aparece no diálogo. As `key` distintas remontam o diálogo
 * quando o estado vira, para não herdar erro do estado anterior.
 */
export function BlockToggle({ kind, userId, name, blocked }: BlockToggleProps) {
  if (blocked) {
    return (
      <ConfirmAction
        key="desbloquear"
        tone="neutral"
        triggerLabel="Desbloquear"
        title="Desbloquear conta"
        description={`${name} volta a entrar no app com a própria senha ou login social.`}
        confirmLabel="Confirmar desbloqueio"
        action={() => setBlockedAction(kind, userId, false)}
      />
    );
  }

  const professorNote =
    kind === "professor"
      ? " O perfil sai do catálogo e da busca de aulas; aulas já confirmadas não são canceladas."
      : "";

  return (
    <ConfirmAction
      key="bloquear"
      tone="danger"
      triggerLabel="Bloquear"
      title="Bloquear conta"
      description={`${name} perde o acesso na próxima requisição e não consegue entrar de novo até ser desbloqueado.${professorNote}`}
      confirmLabel="Confirmar bloqueio"
      action={() => setBlockedAction(kind, userId, true)}
    />
  );
}
