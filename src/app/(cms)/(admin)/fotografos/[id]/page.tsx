import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { orNotFound } from "@/lib/api/or-not-found";
import { entityIdSchema } from "@/lib/admin-action";
import { formatNumber } from "@/lib/admin-labels";
import { formatDate } from "@/lib/labels";
import { hrefWith } from "@/lib/search-params";
import { BlockToggle } from "@/components/block-toggle";
import { EmptyState } from "@/components/empty-state";
import { PersonHeader } from "@/components/person-header";
import { PersonStatusBadge } from "@/components/pill";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Fotógrafo | FlowState CMS",
};

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2";

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
        meta={`Cadastro em ${formatDate(photographer.createdAt)}`}
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
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Sessões" value={photographer.sessionsCount} />
          <StatCard label="Fotos" value={photographer.photosCount} />
          <StatCard label="Vídeos" value={photographer.videosCount} />
        </div>
        <Link
          href={hrefWith("/midias", { fotografo: photographer.id })}
          className="self-start text-sm text-primary underline-offset-2 hover:underline"
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
          <div
            role="region"
            aria-label="Sessões recentes do fotógrafo"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Sessões recentes</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th scope="col" className={TH}>Data</th>
                  <th scope="col" className={TH}>Local</th>
                  <th scope="col" className={TH}>Fotos</th>
                  <th scope="col" className={TH}>Vídeos</th>
                  <th scope="col" className={TH}>Mídias</th>
                </tr>
              </thead>
              <tbody>
                {photographer.recentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/60">
                    <td className={`${TD} text-text-muted`}>{formatDate(session.sessionDate)}</td>
                    <td className={TD}>{session.location}</td>
                    <td className={`${TD} text-text-muted`}>{formatNumber(session.photoCount)}</td>
                    <td className={`${TD} text-text-muted`}>{formatNumber(session.videoCount)}</td>
                    <td className={TD}>
                      <Link
                        href={hrefWith("/midias", {
                          dia: session.sessionDate,
                          fotografo: photographer.id,
                        })}
                        aria-label={`Ver mídias da sessão em ${session.location}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Ver mídias
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
