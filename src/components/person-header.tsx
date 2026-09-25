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

/** Cabeçalho do detalhe de pessoa: voltar, nome, selos, e-mail e ações. */
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
      <Link href={backHref} className="text-sm text-text-muted hover:text-text">
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-semibold text-text">{name}</h1>
            {badges}
          </div>
          <p className="text-sm text-text-muted">{email}</p>
          {meta && <p className="text-xs text-text-muted">{meta}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-start gap-2">{actions}</div>}
      </div>
    </header>
  );
}
