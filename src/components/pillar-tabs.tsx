import Link from "next/link";
import type { CmsPillar, PillarKey } from "@/lib/api/schemas";
import { PILLAR_ORDER } from "@/lib/labels";

type PillarTabsProps = {
  pillars: CmsPillar[];
  active: PillarKey;
  buildHref: (pillar: PillarKey) => string;
};

/** Abas de navegação por pilar, com contagem total de treinos de cada um. */
export function PillarTabs({ pillars, active, buildHref }: PillarTabsProps) {
  const byKey = new Map(pillars.map((pillar) => [pillar.key, pillar]));

  return (
    <nav aria-label="Pilares" className="flex gap-1 border-b border-border">
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
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
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
