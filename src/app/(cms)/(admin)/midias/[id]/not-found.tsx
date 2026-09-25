import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function MidiaNotFound() {
  return (
    <EmptyState
      title="Mídia não encontrada."
      description="Ela pode ter sido removida."
      action={
        <Link
          href="/midias"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background"
        >
          Voltar para mídias
        </Link>
      }
    />
  );
}
