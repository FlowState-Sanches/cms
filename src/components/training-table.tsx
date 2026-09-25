import Link from "next/link";
import type { CmsTrainingListItem } from "@/lib/api/schemas";
import { formatDate } from "@/lib/labels";
import { ResponsiveList } from "./responsive-list";
import { StatusBadge } from "./status-badge";

type TrainingTableProps = {
  items: CmsTrainingListItem[];
};

/**
 * Treinos do pilar/filtro atual: tabela a partir de 768 px e cartões com o
 * título como link abaixo disso. Server Component (sem interação própria).
 */
export function TrainingTable({ items }: TrainingTableProps) {
  return (
    <ResponsiveList
      label="Treinos"
      caption="Lista de treinos do pilar selecionado"
      items={items}
      itemKey={(item) => item.id}
      tableMinWidth="min-w-[720px]"
      columns={[
        { header: "Ordem", cell: (item) => item.order },
        { header: "Código", cell: (item) => <span className="font-mono">{item.code}</span> },
        {
          header: "Título",
          primary: true,
          cell: (item) => (
            <Link
              href={`/treinos/${item.id}`}
              className="font-medium text-text underline-offset-2 hover:underline focus-visible:underline"
            >
              {item.title}
            </Link>
          ),
        },
        { header: "Nível", cell: (item) => item.levelLabel },
        { header: "Status", cell: (item) => <StatusBadge status={item.status} /> },
        { header: "Autor", cell: (item) => item.author?.name ?? "FlowState" },
        { header: "Atualizado", cell: (item) => formatDate(item.updatedAt) },
      ]}
    />
  );
}
