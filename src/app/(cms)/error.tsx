"use client";

import { useEffect } from "react";

type CmsErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Boundary de erro genérico para as páginas sob o shell `(cms)` que não têm
 * o próprio `error.tsx` (hoje: /revisao e /pilares/[key]/ordem). `/treinos`
 * mantém o seu, mais específico. Não cobre falhas do próprio
 * `(cms)/layout.tsx` (ver `src/app/error.tsx`).
 */
export default function CmsError({ error, retry }: CmsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center md:px-6"
    >
      <h2 className="font-display text-lg font-semibold text-text">
        Não foi possível carregar esta página.
      </h2>
      <p className="text-sm text-text-muted">Tente novamente em instantes.</p>
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
