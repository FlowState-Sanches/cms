import type { ReactNode } from "react";
import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Estado vazio genérico (lista sem itens, filtro sem resultado etc). */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-12 text-center">
      <p className="font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * `total > 0` mas a página pedida não tem itens (URL de página apagada ou
 * digitada além do fim): mostra um jeito de voltar em vez do estado vazio
 * genérico, que sugeriria (errado) que a busca não encontrou nada.
 */
export function PastPageEmptyState({ firstPageHref }: { firstPageHref: string }) {
  return (
    <EmptyState
      title="Esta página não tem resultados."
      description="A busca ou os filtros têm menos páginas do que a que você abriu."
      action={
        <Link
          href={firstPageHref}
          className="text-primary underline-offset-2 hover:underline"
        >
          Voltar para a primeira página
        </Link>
      }
    />
  );
}
