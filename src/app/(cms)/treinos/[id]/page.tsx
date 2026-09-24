import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccess, getPillars } from "@/lib/api/cached";
import { cmsApi } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { CmsTraining } from "@/lib/api/schemas";
import { PILLAR_ORDER } from "@/lib/labels";
import { canEditTraining } from "@/lib/permissions";
import { fromTraining, trainingIdSchema } from "@/lib/training-schema";
import { StatusBadge } from "@/components/status-badge";
import { TrainingEditor } from "@/components/training-editor";
import { TrainingHistory } from "@/components/training-history";

export const metadata: Metadata = {
  title: "Treino | FlowState CMS",
};

/**
 * A API responde 404 para treino inexistente ou fora da visibilidade do
 * usuário. Só `ApiError` 404 vira `notFound()`; o resto (incluindo o
 * redirect de sessão expirada) é relançado.
 */
async function loadTraining(id: string): Promise<CmsTraining> {
  try {
    return await cmsApi.detail(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!trainingIdSchema.safeParse(id).success) {
    notFound();
  }

  const [training, access, pillars] = await Promise.all([
    loadTraining(id),
    getAccess(),
    getPillars(),
  ]);

  const pillarOptions = PILLAR_ORDER.map((key) => ({
    key,
    label: pillars.find((item) => item.key === key)?.label ?? key,
  }));
  const editable = canEditTraining(training, access);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/treinos?pilar=${training.pillar}`}
          className="text-sm text-text-muted hover:text-text"
        >
          Voltar para treinos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-text-muted">
            {training.code}
          </span>
          <h1 className="font-display text-xl font-semibold text-text">
            {training.title}
          </h1>
          <StatusBadge status={training.status} />
        </div>
        <p className="text-sm text-text-muted">
          Versão {training.version}
          {training.author ? ` · Autor: ${training.author.name}` : ""}
        </p>
      </header>

      {training.status === "draft" && training.reviewComment && (
        <div
          role="note"
          className="rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-text"
        >
          <span className="font-medium">Devolvido pela curadoria:</span>{" "}
          <span className="whitespace-pre-line">{training.reviewComment}</span>
        </div>
      )}

      {!editable && (
        <p className="text-sm text-text-muted">
          Você pode ver este treino, mas não editá-lo no status atual.
        </p>
      )}

      <TrainingEditor
        mode="edit"
        trainingId={training.id}
        defaultValues={fromTraining(training)}
        pillarOptions={pillarOptions}
        readOnly={!editable}
        hasCompletions={training.hasCompletions}
        demoVideoUrl={training.demoVideoUrl}
        hasVideo={training.hasVideo}
        statusActions={{
          training: {
            id: training.id,
            status: training.status,
            author: training.author,
            publishedAt: training.publishedAt,
            hasCompletions: training.hasCompletions,
          },
          access,
        }}
        sidebar={<TrainingHistory events={training.events} />}
      />
    </div>
  );
}
