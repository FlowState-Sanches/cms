import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reorderAction } from "@/app/(cms)/treinos/actions";
import { cmsApi } from "@/lib/api/client";
import { getAccess, getPillars } from "@/lib/api/cached";
import { pillarKeySchema } from "@/lib/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { ReorderList } from "@/components/reorder-list";

export const metadata: Metadata = {
  title: "Reordenar pilar | FlowState CMS",
};

const LIST_LIMIT = 100;

/**
 * Reordenação do pilar (só curadoria, ver matriz de permissão: "reordenar").
 * `key` inválida ou sem permissão de curadoria caem no mesmo `notFound()`.
 * A API espera a lista completa dos treinos não arquivados do pilar; como o
 * catálogo real tem poucas dezenas de treinos por pilar, um único `limit:
 * 100` é suficiente (sem paginação aqui).
 */
export default async function OrdemPilarPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const parsedKey = pillarKeySchema.safeParse(key);
  if (!parsedKey.success) {
    notFound();
  }
  const pillar = parsedKey.data;

  const access = await getAccess();
  if (!access.canCurate) {
    notFound();
  }

  const [pillars, list] = await Promise.all([
    getPillars(),
    cmsApi.list({ pillar, limit: LIST_LIMIT }),
  ]);

  const pillarLabel = pillars.find((item) => item.key === pillar)?.label ?? pillar;
  const items = list.items.filter((item) => item.status !== "archived");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          href={`/treinos?pilar=${pillar}`}
          className="inline-flex min-h-11 items-center self-start text-sm text-text-muted hover:text-text lg:min-h-0"
        >
          Voltar para treinos
        </Link>
        <h1 className="font-display text-xl font-semibold text-text wrap-anywhere">
          Reordenar pilar: {pillarLabel}
        </h1>
        <p className="text-sm text-text-muted">
          Use os botões de mover ou, com o item focado, Alt+Seta para cima/baixo.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nenhum treino não arquivado neste pilar para reordenar." />
      ) : (
        <ReorderList
          pillar={pillar}
          items={items}
          onSave={reorderAction.bind(null, pillar)}
        />
      )}
    </div>
  );
}
