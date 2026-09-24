import type { ReactNode } from "react";
import { getAccess, getPillars } from "@/lib/api/cached";
import { AppShell } from "@/components/app-shell";
import { SemAcesso } from "./sem-acesso";

/**
 * Layout das rotas autenticadas do CMS (grupo de rotas `(cms)`, não entra
 * na URL). `getAccess()` já redireciona para `/sessao-expirada` se a API
 * responder 401 (ver `authedRequest`), então aqui só tratamos o caso
 * "autenticado mas sem permissão de edição" (`canEdit: false`). Nenhum
 * `try/catch` envolve essas chamadas: o redirect de sessão expirada não
 * pode ser engolido.
 */
export default async function CmsLayout({ children }: { children: ReactNode }) {
  const access = await getAccess();

  if (!access.canEdit) {
    return (
      <SemAcesso message="Sua conta está autenticada, mas não tem permissão para editar a Trilha de Aprendizado." />
    );
  }

  const reviewCount = access.canCurate ? await getReviewCount() : 0;

  return (
    <AppShell access={access} reviewCount={reviewCount}>
      {children}
    </AppShell>
  );
}

async function getReviewCount(): Promise<number> {
  const pillars = await getPillars();
  return pillars.reduce((sum, pillar) => sum + pillar.counts.review, 0);
}
