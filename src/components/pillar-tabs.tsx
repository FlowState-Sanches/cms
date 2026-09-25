import Link from "next/link";
import type { CmsPillar, PillarKey } from "@/lib/api/schemas";
import { PILLAR_ORDER } from "@/lib/labels";

type PillarTabsProps = {
  pillars: CmsPillar[];
  active: PillarKey;
  buildHref: (pillar: PillarKey) => string;
};

/**
 * Abas de navegação por pilar, com contagem total de treinos de cada um.
 * Abaixo de 768 px viram uma grade 2 x 2 para não rolar a página.
 */
export function PillarTabs({ pillars, active, buildHref }: PillarTabsProps) {
  const byKey = new Map(pillars.map((pillar) => [pillar.key, pillar]));

  return (
    <nav aria-label="Pilares" className="grid grid-cols-2 gap-1 border-b border-border md:flex">
      {PILLAR_ORDER.map((key) => {
        const pillar = byKey.get(key);
        const isActive = key === active;
        const total = pillar
          ? Object.values(pillar.counts).reduce((sum, value) => sum + value, 0)
          : 0;

        return (
          <Link
            key={key}
            href={buildHref(key)}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 items-center justify-center rounded-md border-b-2 border-transparent px-3 py-2 text-sm font-medium md:justify-start md:rounded-t-md md:rounded-b-none md:px-4 lg:min-h-0 ${
              isActive
                ? "bg-primary-soft text-primary md:border-primary md:bg-transparent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {pillar?.label ?? key}
            <span className="ml-1.5 text-xs text-text-muted">{total}</span>
          </Link>
        );
      })}
    </nav>
  );
}
