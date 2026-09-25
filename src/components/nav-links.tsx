"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  /** Número ao lado do rótulo (ex.: tamanho da fila de revisão). */
  count?: number;
};

type NavLinksProps = {
  items: NavItem[];
  /** `bar`: barra horizontal a partir de 1024 px. `menu`: lista vertical do menu recolhível. */
  variant: "bar" | "menu";
};

/** A própria rota ou qualquer rota abaixo dela (`/professores/abc` ativa Professores). */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NAV_CLASS = {
  bar: "hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:flex",
  menu: "flex flex-col gap-1",
} as const;

const LINK_CLASS = {
  bar: "text-text hover:text-primary aria-[current=page]:text-primary",
  menu: "flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-base text-text hover:bg-surface aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary",
} as const;

const COUNT_CLASS = {
  bar: "ml-1.5 text-xs text-text-muted",
  menu: "shrink-0 text-xs text-text-muted",
} as const;

/**
 * Links da navegação principal. Client Component só para ler o `pathname`
 * e marcar o item atual com `aria-current="page"`; a lista chega pronta do
 * `AppShell` (Server Component). As duas variantes usam o mesmo nome
 * acessível ("Principal"): só uma fica visível por vez e a outra sai da
 * árvore de acessibilidade por CSS (`display: none` ou `<details>` fechado).
 */
export function NavLinks({ items, variant }: NavLinksProps) {
  // Fora do router (testes), usePathname devolve null.
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Principal" className={NAV_CLASS[variant]}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
          className={LINK_CLASS[variant]}
        >
          {item.label}
          {item.count !== undefined && (
            <span className={COUNT_CLASS[variant]}>{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
