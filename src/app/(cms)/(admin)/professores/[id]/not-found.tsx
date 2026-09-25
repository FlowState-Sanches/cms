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
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-background lg:inline lg:min-h-0"
        >
          Voltar para professores
        </Link>
      }
    />
  );
}
