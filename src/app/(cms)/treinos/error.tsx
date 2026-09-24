"use client";

import { useEffect } from "react";

type TreinosErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Boundary de erro de `/treinos`: cobre a lista e (por herança de segmento)
 * o detalhe em `/treinos/[id]`, por isso a copy é genérica o bastante para
 * as duas.
 */
export default function TreinosError({ error, retry }: TreinosErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <h2 className="font-display text-lg font-semibold text-text">
        Não foi possível carregar esta página.
      </h2>
      <p className="text-sm text-text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background"
      >
        Tentar de novo
      </button>
    </div>
  );
}
