"use client";

import { useState, useTransition } from "react";
import { setVerifiedAction } from "@/app/(cms)/(admin)/actions";
import { ConfirmAction } from "./confirm-action";

type VerifyToggleProps = {
  professorId: string;
  name: string;
  verified: boolean;
};

/**
 * Verificar é direto (acrescenta o professor ao catálogo); remover a
 * verificação tira o professor do catálogo e da busca, então pede
 * confirmação.
 */
export function VerifyToggle({ professorId, name, verified }: VerifyToggleProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (verified) {
    return (
      <ConfirmAction
        tone="neutral"
        triggerLabel="Remover verificação"
        title="Remover verificação"
        description={`${name} sai do catálogo do app e da busca de aulas até ser verificado de novo. Aulas já confirmadas continuam valendo.`}
        confirmLabel="Confirmar remoção"
        action={() => setVerifiedAction(professorId, false)}
      />
    );
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const result = await setVerifiedAction(professorId, true);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={verify}
        disabled={pending}
        aria-busy={pending || undefined}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        Verificar professor
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
