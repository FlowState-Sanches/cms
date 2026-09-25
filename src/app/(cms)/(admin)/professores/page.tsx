import type { Metadata } from "next";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import {
  formatNumber,
  PERSON_STATUS_OPTIONS,
  PERSON_STATUS_PARAM,
  VERIFICATION_OPTIONS,
  VERIFICATION_PARAM,
} from "@/lib/admin-labels";
import {
  firstParam,
  hrefWith,
  parseOption,
  parsePage,
  parseSearch,
  type SearchParams,
} from "@/lib/search-params";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { PeopleTable } from "@/components/people-table";
import { VerificationPill } from "@/components/pill";

export const metadata: Metadata = {
  title: "Professores | FlowState CMS",
};

const PAGE_SIZE = 20;

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const raw = await searchParams;
  const q = parseSearch(firstParam(raw.q));
  const verificacao = firstParam(raw.verificacao);
  const status = firstParam(raw.status);
  const verified = parseOption(verificacao, VERIFICATION_PARAM);
  const apiStatus = parseOption(status, PERSON_STATUS_PARAM);
  const page = parsePage(firstParam(raw.pagina));

  const list = await adminApi.professors({
    q,
    verified,
    status: apiStatus,
    page,
    limit: PAGE_SIZE,
  });

  const filters = {
    q,
    verificacao: verified === undefined ? undefined : verificacao,
    status: apiStatus ? status : undefined,
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-text">Professores</h1>

      <FilterBar
        label="Filtrar professores"
        action="/professores"
        fields={[
          { kind: "search", name: "q", label: "Buscar por nome ou e-mail", value: q },
          {
            kind: "select",
            name: "verificacao",
            label: "Verificação",
            value: filters.verificacao,
            options: VERIFICATION_OPTIONS,
          },
          {
            kind: "select",
            name: "status",
            label: "Status",
            value: filters.status,
            options: PERSON_STATUS_OPTIONS,
          },
        ]}
      />

      {list.items.length === 0 ? (
        <EmptyState
          title="Nenhum professor encontrado."
          description="Ajuste a busca ou os filtros."
        />
      ) : (
        <>
          <PeopleTable
            label="Professores"
            items={list.items}
            hrefFor={(professor) => `/professores/${professor.id}`}
            columns={[
              {
                header: "Verificação",
                cell: (professor) => <VerificationPill verified={professor.verified} />,
              },
              { header: "Aulas", cell: (professor) => formatNumber(professor.lessonsCount) },
            ]}
          />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(target) => hrefWith("/professores", { ...filters, pagina: target })}
          />
        </>
      )}
    </div>
  );
}
