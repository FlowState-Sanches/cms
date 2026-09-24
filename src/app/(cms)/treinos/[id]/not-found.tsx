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
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background"
        >
          Voltar para treinos
        </Link>
      }
    />
  );
}
