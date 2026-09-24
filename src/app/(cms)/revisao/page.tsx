import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cmsApi } from "@/lib/api/client";
import { getAccess } from "@/lib/api/cached";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { TrainingTable } from "@/components/training-table";

export const metadata: Metadata = {
  title: "Fila de revisão | FlowState CMS",
};

const PAGE_SIZE = 20;

type RevisaoSearchParams = {
  pagina?: string;
};

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Fila de revisão: todos os treinos em `review`, de qualquer pilar. Só a
 * curadoria vê esta página (`canCurate`); sem essa permissão, `notFound()`
 * (mesmo tratamento de "não existe" usado no resto do CMS, sem expor que a
 * rota existe para quem não pode usá-la).
 */
export default async function RevisaoPage({
  searchParams,
}: {
  searchParams: Promise<RevisaoSearchParams>;
}) {
  const access = await getAccess();
  if (!access.canCurate) {
    notFound();
  }

  const { pagina } = await searchParams;
  const page = parsePage(pagina);

  const list = await cmsApi.list({ status: "review", page, limit: PAGE_SIZE });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-text">
        Fila de revisão
      </h1>

      {list.items.length === 0 ? (
        <EmptyState title="Nada aguardando revisão." />
      ) : (
        <>
          <TrainingTable items={list.items} />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(targetPage) =>
              targetPage > 1 ? `/revisao?pagina=${targetPage}` : "/revisao"
            }
          />
        </>
      )}
    </div>
  );
}
