import type { ReactNode } from "react";

type SemAcessoProps = {
  message: string;
  /** Substitui o botão Sair (ex.: link para Treinos dentro do shell). */
  action?: ReactNode;
};

/**
 * Tela de acesso restrito. Fora do shell (conta sem `canEdit`) o único
 * caminho é sair; dentro do shell (professor numa rota de admin) a ação é
 * voltar para Treinos.
 */
export function SemAcesso({ message, action }: SemAcessoProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="font-display text-xl font-semibold text-text">Acesso restrito</h1>
      <p className="max-w-sm text-sm text-text-muted">{message}</p>
      {action ?? (
        <form action="/logout" method="post">
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm text-text hover:border-primary"
          >
            Sair
          </button>
        </form>
      )}
    </div>
  );
}
