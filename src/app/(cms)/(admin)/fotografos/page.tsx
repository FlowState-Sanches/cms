import type { Metadata } from "next";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { formatNumber, PERSON_STATUS_OPTIONS, PERSON_STATUS_PARAM } from "@/lib/admin-labels";
import {
  firstParam,
  hrefWith,
  parseOption,
  parsePage,
  parseSearch,
  type SearchParams,
} from "@/lib/search-params";
import { EmptyState, PastPageEmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { PeopleTable } from "@/components/people-table";

export const metadata: Metadata = {
  title: "Fotógrafos | FlowState CMS",
};

const PAGE_SIZE = 20;

export default async function FotografosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const raw = await searchParams;
  const q = parseSearch(firstParam(raw.q));
  const status = firstParam(raw.status);
  const apiStatus = parseOption(status, PERSON_STATUS_PARAM);
  const page = parsePage(firstParam(raw.pagina));

  const list = await adminApi.photographers({ q, status: apiStatus, page, limit: PAGE_SIZE });
  const filters = { q, status: apiStatus ? status : undefined };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-text">Fotógrafos</h1>

      <FilterBar
        label="Filtrar fotógrafos"
        action="/fotografos"
        fields={[
          { kind: "search", name: "q", label: "Buscar por nome ou e-mail", value: q },
          {
            kind: "select",
            name: "status",
            label: "Status",
            value: filters.status,
            options: PERSON_STATUS_OPTIONS,
          },
        ]}
      />

      {list.total === 0 ? (
        <EmptyState title="Nenhum fotógrafo encontrado." description="Ajuste a busca ou os filtros." />
      ) : list.items.length === 0 ? (
        <PastPageEmptyState
          firstPageHref={hrefWith("/fotografos", { ...filters, pagina: undefined })}
        />
      ) : (
        <>
          <PeopleTable
            label="Fotógrafos"
            items={list.items}
            hrefFor={(photographer) => `/fotografos/${photographer.id}`}
            columns={[
              { header: "Sessões", cell: (p) => formatNumber(p.sessionsCount) },
              { header: "Fotos", cell: (p) => formatNumber(p.photosCount) },
              { header: "Vídeos", cell: (p) => formatNumber(p.videosCount) },
            ]}
          />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(target) => hrefWith("/fotografos", { ...filters, pagina: target })}
          />
        </>
      )}
    </div>
  );
}
