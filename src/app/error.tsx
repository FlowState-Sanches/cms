"use client";

import { useEffect } from "react";

type RootErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Boundary de erro do segmento raiz (`src/app/error.tsx`). No Next 16 um
 * `error.tsx` não envolve o `layout.tsx` do mesmo segmento: este arquivo é
 * quem cobre falhas em `(cms)/layout.tsx` (API fora do ar, 5xx, resposta
 * inesperada), já que o layout do grupo `(cms)` está um nível abaixo do
 * `app/layout.tsx`. Erros do próprio `app/layout.tsx` caem em
 * `global-error.tsx`.
 */
export default function RootError({ error, retry }: RootErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12 text-center md:px-6"
    >
      <h2 className="font-display text-lg font-semibold text-text">
        Não foi possível carregar o CMS.
      </h2>
      <p className="text-sm text-text-muted">
        A API pode estar fora do ar ou ter respondido de forma inesperada.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-background lg:min-h-0"
      >
        Tentar de novo
      </button>
    </div>
  );
}
