import type { Metadata } from "next";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import {
  PERSON_STATUS_OPTIONS,
  PERSON_STATUS_PARAM,
  PLAN_OPTIONS,
  PLAN_PARAM,
} from "@/lib/admin-labels";
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
import { PlanPill } from "@/components/pill";

export const metadata: Metadata = {
  title: "Alunos | FlowState CMS",
};

const PAGE_SIZE = 20;

/** Alunos = surfista (gratuito) + aluno (pago), com selo de plano (G1). */
export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const raw = await searchParams;
  const q = parseSearch(firstParam(raw.q));
  const plano = firstParam(raw.plano);
  const status = firstParam(raw.status);
  const plan = parseOption(plano, PLAN_PARAM);
  const apiStatus = parseOption(status, PERSON_STATUS_PARAM);
  const page = parsePage(firstParam(raw.pagina));

  const list = await adminApi.students({ q, plan, status: apiStatus, page, limit: PAGE_SIZE });

  const filters = {
    q,
    plano: plan ? plano : undefined,
    status: apiStatus ? status : undefined,
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-text">Alunos</h1>

      <FilterBar
        label="Filtrar alunos"
        action="/alunos"
        fields={[
          { kind: "search", name: "q", label: "Buscar por nome ou e-mail", value: q },
          { kind: "select", name: "plano", label: "Plano", value: filters.plano, options: PLAN_OPTIONS },
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
        <EmptyState title="Nenhum aluno encontrado." description="Ajuste a busca ou os filtros." />
      ) : list.items.length === 0 ? (
        <PastPageEmptyState firstPageHref={hrefWith("/alunos", { ...filters, pagina: undefined })} />
      ) : (
        <>
          <PeopleTable
            label="Alunos"
            items={list.items}
            hrefFor={(student) => `/alunos/${student.id}`}
            columns={[{ header: "Plano", cell: (student) => <PlanPill plan={student.plan} /> }]}
          />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(target) => hrefWith("/alunos", { ...filters, pagina: target })}
          />
        </>
      )}
    </div>
  );
}
