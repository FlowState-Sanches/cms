type SemAcessoProps = {
  message: string;
};

/**
 * Tela mostrada quando `cmsApi.access()` devolve `canEdit: false`: o
 * usuário está autenticado, mas não tem permissão para editar a Trilha.
 * Único caminho é sair e entrar com outra conta.
 */
export function SemAcesso({ message }: SemAcessoProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="font-display text-xl font-semibold text-text">Acesso restrito</h1>
      <p className="max-w-sm text-sm text-text-muted">{message}</p>
      <form action="/logout" method="post">
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm text-text hover:border-primary"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
