import type { Metadata } from "next";
import Link from "next/link";
import { getPillars } from "@/lib/api/cached";
import { pillarKeySchema } from "@/lib/api/schemas";
import { PILLAR_ORDER } from "@/lib/labels";
import { emptyTrainingForm } from "@/lib/training-schema";
import { TrainingEditor } from "@/components/training-editor";

export const metadata: Metadata = {
  title: "Novo treino | FlowState CMS",
};

export default async function NovoTreinoPage({
  searchParams,
}: {
  searchParams: Promise<{ pilar?: string }>;
}) {
  const { pilar } = await searchParams;
  const parsed = pillarKeySchema.safeParse(pilar);
  const pillar = parsed.success ? parsed.data : "tecnico";

  const pillars = await getPillars();
  const pillarOptions = PILLAR_ORDER.map((key) => ({
    key,
    label: pillars.find((item) => item.key === key)?.label ?? key,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/treinos?pilar=${pillar}`}
          className="text-sm text-text-muted hover:text-text"
        >
          Voltar para treinos
        </Link>
        <h1 className="font-display text-xl font-semibold text-text">
          Novo treino
        </h1>
        <p className="text-sm text-text-muted">
          O treino é salvo como rascunho. Envie para revisão quando estiver
          pronto.
        </p>
      </div>
      <TrainingEditor
        mode="create"
        defaultValues={emptyTrainingForm(pillar)}
        pillarOptions={pillarOptions}
      />
    </div>
  );
}
