import Link from "next/link";
import type { ReactNode } from "react";
import { getAccess } from "@/lib/api/cached";
import { SemAcesso } from "../sem-acesso";

/**
 * Grupo de rotas da gestão operacional (H1: só curadoria). A API recusa com
 * 403 tudo o que vem daqui para quem não é admin; esta tela só evita que o
 * professor veja um erro genérico. Cada página também chama `isCurator()`
 * antes de buscar dados, porque layout não controla se a página roda.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAccess();

  if (!access.canCurate) {
    return (
      <SemAcesso
        message="Esta área é da curadoria FlowState. Sua conta continua com acesso aos Treinos."
        action={
          <Link
            href="/treinos"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-background lg:min-h-0"
          >
            Ir para Treinos
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
