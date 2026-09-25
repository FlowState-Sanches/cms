import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { orNotFound } from "@/lib/api/or-not-found";
import { entityIdSchema } from "@/lib/admin-action";
import { LESSON_STATUS_LABELS } from "@/lib/admin-labels";
import { formatTime } from "@/lib/dates";
import { formatDate, formatTimestamp } from "@/lib/labels";
import { BlockToggle } from "@/components/block-toggle";
import { EmptyState } from "@/components/empty-state";
import { PersonHeader } from "@/components/person-header";
import { PersonStatusBadge, Pill, PlanPill } from "@/components/pill";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Aluno | FlowState CMS",
};

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2";

export default async function AlunoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurator())) {
    return null;
  }

  const { id } = await params;
  if (!entityIdSchema.safeParse(id).success) {
    notFound();
  }

  const student = await orNotFound(() => adminApi.student(id));

  return (
    <div className="flex flex-col gap-6">
      <PersonHeader
        backHref="/alunos"
        backLabel="Voltar para alunos"
        name={student.name}
        email={student.email}
        meta={`Cadastro em ${formatTimestamp(student.createdAt)}`}
        badges={
          <>
            <PlanPill plan={student.plan} />
            <PersonStatusBadge blocked={student.blocked} />
          </>
        }
        actions={
          <BlockToggle kind="aluno" userId={student.id} name={student.name} blocked={student.blocked} />
        }
      />

      <section aria-labelledby="aluno-numeros" className="flex flex-col gap-3">
        <h2 id="aluno-numeros" className="sr-only">
          Números do aluno
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="Aulas" value={student.lessonsCount} />
          <StatCard label="Inscrições em aulas em grupo e eventos" value={student.enrollmentsCount} />
          <StatCard label="Sessões em que aparece" value={student.taggedSessionsCount} />
        </div>
      </section>

      <section aria-labelledby="aluno-aulas" className="flex flex-col gap-3">
        <h2 id="aluno-aulas" className="font-display text-base font-semibold text-text">
          Aulas recentes
        </h2>
        {student.recentLessons.length === 0 ? (
          <EmptyState title="Nenhuma aula registrada." />
        ) : (
          <div
            role="region"
            aria-label="Aulas recentes do aluno"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Aulas recentes</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th scope="col" className={TH}>Data</th>
                  <th scope="col" className={TH}>Horário</th>
                  <th scope="col" className={TH}>Professor</th>
                  <th scope="col" className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.recentLessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b border-border/60">
                    <td className={`${TD} text-text-muted`}>{formatDate(lesson.date)}</td>
                    <td className={`${TD} text-text-muted`}>{formatTime(lesson.startTime)}</td>
                    <td className={TD}>
                      <Link
                        href={`/professores/${lesson.professor.id}`}
                        className="text-text underline-offset-2 hover:underline"
                      >
                        {lesson.professor.name}
                      </Link>
                    </td>
                    <td className={TD}>
                      <Pill tone={lesson.status === "confirmed" ? "primary" : "danger"}>
                        {LESSON_STATUS_LABELS[lesson.status]}
                      </Pill>
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
