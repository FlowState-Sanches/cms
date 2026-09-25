import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { orNotFound } from "@/lib/api/or-not-found";
import { entityIdSchema } from "@/lib/admin-action";
import { formatNumber } from "@/lib/admin-labels";
import { formatDate, formatTimestamp } from "@/lib/labels";
import { hrefWith } from "@/lib/search-params";
import { BlockToggle } from "@/components/block-toggle";
import { EmptyState } from "@/components/empty-state";
import { PersonHeader } from "@/components/person-header";
import { PersonStatusBadge } from "@/components/pill";
import { ResponsiveList } from "@/components/responsive-list";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Fotógrafo | FlowState CMS",
};

export default async function FotografoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurator())) {
    return null;
  }

  const { id } = await params;
  if (!entityIdSchema.safeParse(id).success) {
    notFound();
  }

  const photographer = await orNotFound(() => adminApi.photographer(id));

  return (
    <div className="flex flex-col gap-6">
      <PersonHeader
        backHref="/fotografos"
        backLabel="Voltar para fotógrafos"
        name={photographer.name}
        email={photographer.email}
        meta={`Cadastro em ${formatTimestamp(photographer.createdAt)}`}
        badges={<PersonStatusBadge blocked={photographer.blocked} />}
        actions={
          <BlockToggle
            kind="fotografo"
            userId={photographer.id}
            name={photographer.name}
            blocked={photographer.blocked}
          />
        }
      />

      <section aria-labelledby="fotografo-numeros" className="flex flex-col gap-3">
        <h2 id="fotografo-numeros" className="sr-only">
          Números do fotógrafo
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Sessões" value={photographer.sessionsCount} />
          <StatCard label="Fotos" value={photographer.photosCount} />
          <StatCard label="Vídeos" value={photographer.videosCount} />
        </div>
        <Link
          href={hrefWith("/midias", { fotografo: photographer.id })}
          className="inline-flex min-h-11 items-center self-start text-sm text-primary underline-offset-2 hover:underline lg:min-h-0"
        >
          Ver todas as mídias
        </Link>
      </section>

      <section aria-labelledby="fotografo-sessoes" className="flex flex-col gap-3">
        <h2 id="fotografo-sessoes" className="font-display text-base font-semibold text-text">
          Sessões recentes
        </h2>
        {photographer.recentSessions.length === 0 ? (
          <EmptyState title="Nenhuma sessão registrada." />
        ) : (
          <ResponsiveList
            label="Sessões recentes do fotógrafo"
            caption="Sessões recentes"
            items={photographer.recentSessions}
            itemKey={(session) => session.id}
            tableMinWidth="min-w-[560px]"
            columns={[
              { header: "Data", cell: (session) => formatDate(session.sessionDate) },
              {
                header: "Local",
                primary: true,
                cell: (session) => <span className="text-text">{session.location}</span>,
              },
              { header: "Fotos", cell: (session) => formatNumber(session.photoCount) },
              { header: "Vídeos", cell: (session) => formatNumber(session.videoCount) },
              {
                header: "Mídias",
                cell: (session) => (
                  <Link
                    href={hrefWith("/midias", {
                      dia: session.sessionDate,
                      fotografo: photographer.id,
                    })}
                    aria-label={`Ver mídias da sessão em ${session.location}`}
                    className="inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline md:inline md:min-h-0"
                  >
                    Ver mídias
                  </Link>
                ),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
