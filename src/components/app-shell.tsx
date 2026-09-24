import Link from "next/link";
import type { ReactNode } from "react";
import type { CmsAccess } from "@/lib/api/schemas";

type AppShellProps = {
  access: CmsAccess;
  reviewCount: number;
  children: ReactNode;
};

/**
 * Shell autenticado do CMS: skip link, navegação principal e identificação
 * do usuário logado. Server Component; o logout é um form POST para
 * `/logout` (route handler que apaga a sessão), sem precisar de JS no
 * cliente.
 */
export function AppShell({ access, reviewCount, children }: AppShellProps) {
  const role = access.canCurate ? "Curadoria" : "Professor";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
      >
        Pular para o conteúdo
      </a>

      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg font-semibold text-text">FlowState CMS</span>
          <nav aria-label="Principal" className="flex items-center gap-4 text-sm">
            <Link href="/treinos" className="text-text hover:text-primary">
              Treinos
            </Link>
            {access.canCurate && (
              <Link href="/revisao" className="text-text hover:text-primary">
                Fila de revisão
                <span className="ml-1.5 text-xs text-text-muted">{reviewCount}</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-medium text-text">{access.user.name}</p>
            <p className="text-xs text-text-muted">{role}</p>
          </div>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-text hover:border-primary"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main id="conteudo" className="flex flex-1 flex-col gap-4 px-6 py-6">
        {children}
      </main>
    </div>
  );
}
