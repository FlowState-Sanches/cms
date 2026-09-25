import type { ReactNode } from "react";
import type { CmsAccess } from "@/lib/api/schemas";
import { MobileMenu } from "./mobile-menu";
import { NavLinks, type NavItem } from "./nav-links";

type AppShellProps = {
  access: CmsAccess;
  reviewCount: number;
  children: ReactNode;
};

type NavEntry = { href: string; label: string; showsReviewCount?: boolean };

const PROFESSOR_NAV: NavEntry[] = [{ href: "/treinos", label: "Treinos" }];

const ADMIN_NAV: NavEntry[] = [
  { href: "/painel", label: "Painel" },
  { href: "/treinos", label: "Treinos" },
  { href: "/revisao", label: "Fila de revisão", showsReviewCount: true },
  { href: "/professores", label: "Professores" },
  { href: "/alunos", label: "Alunos" },
  { href: "/fotografos", label: "Fotógrafos" },
  { href: "/admins", label: "Admins" },
  { href: "/midias", label: "Mídias" },
];

const LOGOUT_BUTTON = "rounded-md border border-border px-3 py-1.5 text-text hover:border-primary";

/**
 * Shell autenticado do CMS: skip link, navegação principal e identificação
 * do usuário logado. Server Component; o logout é um form POST para
 * `/logout` (route handler que apaga a sessão), sem precisar de JS no
 * cliente. A partir de 1024 px mostra a barra atual; abaixo, o menu
 * recolhível (`MobileMenu`) com os mesmos itens, o usuário e o Sair
 * (spec 5.1). Só `NavLinks` e `MobileMenu` rodam no cliente.
 */
export function AppShell({ access, reviewCount, children }: AppShellProps) {
  const role = access.canCurate ? "Curadoria" : "Professor";
  const items: NavItem[] = (access.canCurate ? ADMIN_NAV : PROFESSOR_NAV).map((entry) => ({
    href: entry.href,
    label: entry.label,
    count: entry.showsReviewCount ? reviewCount : undefined,
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
      >
        Pular para o conteúdo
      </a>

      <header className="relative flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-6 lg:py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-display text-lg font-semibold text-text">FlowState CMS</span>
          <NavLinks items={items} variant="bar" />
        </div>

        <div className="hidden items-center gap-4 text-sm lg:flex">
          <div className="text-right">
            <p className="font-medium text-text">{access.user.name}</p>
            <p className="text-xs text-text-muted">{role}</p>
          </div>
          <form action="/logout" method="post">
            <button type="submit" className={LOGOUT_BUTTON}>
              Sair
            </button>
          </form>
        </div>

        <MobileMenu>
          <NavLinks items={items} variant="menu" />
          <div className="flex flex-col gap-3 border-t border-border pt-3 text-sm">
            <div>
              <p className="font-medium text-text wrap-anywhere">{access.user.name}</p>
              <p className="text-xs text-text-muted">{role}</p>
            </div>
            <form action="/logout" method="post">
              <button type="submit" className={`${LOGOUT_BUTTON} min-h-11 w-full`}>
                Sair
              </button>
            </form>
          </div>
        </MobileMenu>
      </header>

      <main id="conteudo" className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        {children}
      </main>
    </div>
  );
}
