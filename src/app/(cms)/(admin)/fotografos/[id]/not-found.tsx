import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function FotografoNotFound() {
  return (
    <EmptyState
      title="Fotógrafo não encontrado."
      description="A conta pode ter sido excluída ou não ter o papel de fotógrafo."
      action={
        <Link
          href="/fotografos"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background"
        >
          Voltar para fotógrafos
        </Link>
      }
    />
  );
}
