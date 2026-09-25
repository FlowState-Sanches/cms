import type { Metadata } from "next";
import Link from "next/link";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { entityIdSchema } from "@/lib/admin-action";
import {
  MEDIA_STATUS_OPTIONS,
  MEDIA_STATUS_PARAM,
  MEDIA_TYPE_OPTIONS,
  MEDIA_TYPE_PARAM,
} from "@/lib/admin-labels";
import { isIsoDate } from "@/lib/dates";
import {
  firstParam,
  hrefWith,
  parseOption,
  parsePage,
  type SearchParams,
} from "@/lib/search-params";
import { EmptyState, PastPageEmptyState } from "@/components/empty-state";
import { FilterBar, type FilterField } from "@/components/filter-bar";
import { MediaGrid } from "@/components/media-grid";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Mídias | FlowState CMS",
};

const PAGE_SIZE = 24;

export default async function MidiasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const raw = await searchParams;
  const diaParam = firstParam(raw.dia);
  const dia = isIsoDate(diaParam) ? diaParam : undefined;
  const tipo = firstParam(raw.tipo);
  const type = parseOption(tipo, MEDIA_TYPE_PARAM);
  const statusParam = firstParam(raw.status);
  const status = parseOption(statusParam, MEDIA_STATUS_PARAM);
  const fotografoParam = firstParam(raw.fotografo);
  const fotografo = entityIdSchema.safeParse(fotografoParam).success ? fotografoParam : undefined;
  const page = parsePage(firstParam(raw.pagina));
  const removed = firstParam(raw.removida) === "1";

  const list = await adminApi.media({
    date: dia,
    type,
    status,
    photographerId: fotografo,
    page,
    limit: PAGE_SIZE,
  });

  const filters = {
    dia,
    tipo: type ? tipo : undefined,
    status: status ? statusParam : undefined,
    fotografo,
  };

  const fields: FilterField[] = [
    { kind: "date", name: "dia", label: "Dia da sessão", value: dia },
    { kind: "select", name: "tipo", label: "Tipo", value: filters.tipo, options: MEDIA_TYPE_OPTIONS },
    {
      kind: "select",
      name: "status",
      label: "Status",
      value: filters.status,
      options: MEDIA_STATUS_OPTIONS,
    },
  ];
  if (fotografo) {
    fields.push({ kind: "hidden", name: "fotografo", value: fotografo });
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-text">Mídias</h1>

      {removed && (
        <p
          role="status"
          className="rounded-md border border-primary/40 bg-primary-soft px-3 py-2 text-sm text-text"
        >
          Mídia removida.
        </p>
      )}

      <FilterBar label="Filtrar mídias" action="/midias" fields={fields} />

      {fotografo && (
        <p className="text-sm text-text-muted">
          Mostrando só as mídias de um fotógrafo.{" "}
          <Link
            href={hrefWith("/midias", { ...filters, fotografo: undefined })}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ver de todos os fotógrafos
          </Link>
        </p>
      )}

      {list.total === 0 ? (
        <EmptyState title="Nenhuma mídia encontrada." description="Ajuste os filtros." />
      ) : list.items.length === 0 ? (
        <PastPageEmptyState firstPageHref={hrefWith("/midias", { ...filters, pagina: undefined })} />
      ) : (
        <>
          <MediaGrid items={list.items} />
          <Pagination
            page={list.page}
            limit={list.limit}
            total={list.total}
            buildHref={(target) => hrefWith("/midias", { ...filters, pagina: target })}
          />
        </>
      )}
    </div>
  );
}
