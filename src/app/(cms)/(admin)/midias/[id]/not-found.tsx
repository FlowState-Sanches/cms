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
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-background lg:min-h-0"
        >
          Voltar para mídias
        </Link>
      }
    />
  );
}
