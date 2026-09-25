import type { Metadata } from "next";
import Link from "next/link";
import { cmsApi } from "@/lib/api/client";
import { getAccess, getPillars } from "@/lib/api/cached";
import type { PillarKey, TrainingStatus } from "@/lib/api/schemas";
import { pillarKeySchema, trainingStatusSchema } from "@/lib/api/schemas";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { PillarTabs } from "@/components/pillar-tabs";
import { TrainingTable } from "@/components/training-table";

export const metadata: Metadata = {
  title: "Treinos | FlowState CMS",
};

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: TrainingStatus | undefined; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "review", label: "Em revisão" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

type TreinosSearchParams = {
  pilar?: string;
  status?: string;
  pagina?: string;
};

function parsePillar(value: string | undefined): PillarKey {
  const parsed = pillarKeySchema.safeParse(value);
  return parsed.success ? parsed.data : "tecnico";
}

function parseStatus(value: string | undefined): TrainingStatus | undefined {
  const parsed = trainingStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildTreinosHref({
  pilar,
  status,
  pagina,
}: {
  pilar: PillarKey;
  status?: TrainingStatus;
  pagina?: number;
}): string {
  const params = new URLSearchParams({ pilar });
  if (status) {
    params.set("status", status);
  }
  if (pagina && pagina > 1) {
    params.set("pagina", String(pagina));
  }
  return `/treinos?${params.toString()}`;
}

export default async function TreinosPage({
  searchParams,
}: {
  searchParams: Promise<TreinosSearchParams>;
}) {
  const rawParams = await searchParams;
  const pilar = parsePillar(rawParams.pilar);
  const status = parseStatus(rawParams.status);
  const page = parsePage(rawParams.pagina);

  const [access, pillars, list] = await Promise.all([
    getAccess(),
    getPillars(),
    cmsApi.list({ pillar: pilar, status, page, limit: PAGE_SIZE }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <h1 className="font-display text-xl font-semibold text-text">Treinos</h1>
        <div className="flex flex-col gap-2 md:flex-row">
          {access.canCurate && (
            <Link
              href={`/pilares/${pilar}/ordem`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary lg:min-h-0"
            >
              Reordenar pilar
            </Link>
          )}
          <Link
            href={`/treinos/novo?pilar=${pilar}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-background lg:min-h-0"
          >
            Novo treino
          </Link>
        </div>
      </div>

      <PillarTabs
        pillars={pillars}
        active={pilar}
        buildHref={(key) => buildTreinosHref({ pilar: key })}
      />

      <nav aria-label="Filtro de status" className="flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={buildTreinosHref({ pilar, status: filter.value })}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1 lg:min-h-0 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {list.items.length === 0 ? (
        <EmptyState title="Nenhum treino neste filtro." />
      ) : (
        <>
          <TrainingTable items={list.items} />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(targetPage) => buildTreinosHref({ pilar, status, pagina: targetPage })}
          />
        </>
      )}
    </div>
  );
}
