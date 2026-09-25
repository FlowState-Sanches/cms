import Link from "next/link";
import type { ReactNode } from "react";

type PersonHeaderProps = {
  backHref: string;
  backLabel: string;
  name: string;
  email: string;
  meta?: string;
  badges?: ReactNode;
  actions?: ReactNode;
};

/**
 * Cabeçalho do detalhe de pessoa: voltar, nome, selos, e-mail e ações.
 * Abaixo de 768 px as ações empilham em largura total (spec 5.4).
 */
export function PersonHeader({
  backHref,
  backLabel,
  name,
  email,
  meta,
  badges,
  actions,
}: PersonHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center self-start text-sm text-text-muted hover:text-text lg:min-h-0"
      >
        {backLabel}
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 font-display text-xl font-semibold text-text wrap-anywhere">
              {name}
            </h1>
            {badges}
          </div>
          <p className="text-sm text-text-muted wrap-anywhere">{email}</p>
          {meta && <p className="text-xs text-text-muted">{meta}</p>}
        </div>
        {actions && (
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-start">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
