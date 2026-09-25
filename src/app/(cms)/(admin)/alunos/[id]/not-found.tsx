import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function AlunoNotFound() {
  return (
    <EmptyState
      title="Aluno não encontrado."
      description="A conta pode ter sido excluída."
      action={
        <Link
          href="/alunos"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-background lg:min-h-0"
        >
          Voltar para alunos
        </Link>
      }
    />
  );
}
