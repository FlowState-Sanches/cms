import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { orNotFound } from "@/lib/api/or-not-found";
import { entityIdSchema } from "@/lib/admin-action";
import { formatRating } from "@/lib/admin-labels";
import { formatDate } from "@/lib/labels";
import { BlockToggle } from "@/components/block-toggle";
import { PersonHeader } from "@/components/person-header";
import { PersonStatusBadge, VerificationPill } from "@/components/pill";
import { StatCard } from "@/components/stat-card";
import { VerifyToggle } from "@/components/verify-toggle";

export const metadata: Metadata = {
  title: "Professor | FlowState CMS",
};

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const { id } = await params;
  if (!entityIdSchema.safeParse(id).success) {
    notFound();
  }

  const professor = await orNotFound(() => adminApi.professor(id));

  return (
    <div className="flex flex-col gap-6">
      <PersonHeader
        backHref="/professores"
        backLabel="Voltar para professores"
        name={professor.name}
        email={professor.email}
        meta={`Cadastro em ${formatDate(professor.createdAt)}`}
        badges={
          <>
            <VerificationPill verified={professor.verified} />
            <PersonStatusBadge blocked={professor.blocked} />
          </>
        }
        actions={
          <>
            <VerifyToggle
              professorId={professor.id}
              name={professor.name}
              verified={professor.verified}
            />
            <BlockToggle
              kind="professor"
              userId={professor.id}
              name={professor.name}
              blocked={professor.blocked}
            />
          </>
        }
      />

      <section aria-labelledby="professor-numeros" className="flex flex-col gap-3">
        <h2 id="professor-numeros" className="sr-only">
          Números do professor
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Aulas" value={professor.lessonsCount} />
          <StatCard label="Próximas aulas" value={professor.upcomingLessons} />
          <StatCard label="Aulas em grupo e eventos" value={professor.groupEventsCount} />
          <StatCard
            label="Avaliações"
            value={professor.rating.count}
            detail={`Nota média ${formatRating(professor.rating.average)}`}
          />
        </div>
      </section>

      <section aria-labelledby="professor-perfil" className="flex flex-col gap-3">
        <h2 id="professor-perfil" className="font-display text-base font-semibold text-text">
          Perfil
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-text-muted">Localização</dt>
          <dd className="text-text">{professor.profile?.location ?? "Não informada"}</dd>
          <dt className="text-text-muted">Especialidades</dt>
          <dd className="text-text">
            {professor.profile && professor.profile.specialties.length > 0
              ? professor.profile.specialties.join(", ")
              : "Nenhuma"}
          </dd>
          <dt className="text-text-muted">Bio</dt>
          <dd className="whitespace-pre-line text-text">{professor.profile?.bio ?? "Sem bio."}</dd>
        </dl>
      </section>
    </div>
  );
}
