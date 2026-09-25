import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function ProfessorNotFound() {
  return (
    <EmptyState
      title="Professor não encontrado."
      description="A conta pode ter sido excluída ou não ter o papel de professor."
      action={
        <Link
          href="/professores"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background"
        >
          Voltar para professores
        </Link>
      }
    />
  );
}
