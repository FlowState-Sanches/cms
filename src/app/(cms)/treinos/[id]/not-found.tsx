import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function TreinoNotFound() {
  return (
    <EmptyState
      title="Treino não encontrado."
      description="Ele pode ter sido excluído ou não estar disponível para a sua conta."
      action={
        <Link
          href="/treinos"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-background lg:inline lg:min-h-0"
        >
          Voltar para treinos
        </Link>
      }
    />
  );
}
