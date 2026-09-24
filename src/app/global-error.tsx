"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Último recurso: só entra em ação se `app/layout.tsx` (o próprio root
 * layout) falhar ao renderizar. Precisa definir `<html>`/`<body>` porque
 * substitui o root layout inteiro; não tem acesso a `globals.css`.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          role="alert"
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2>Algo deu errado.</h2>
          <p>Não foi possível carregar o CMS. Tente novamente em instantes.</p>
          <button type="button" onClick={() => retry()}>
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
