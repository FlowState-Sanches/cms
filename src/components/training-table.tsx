import Link from "next/link";
import type { CmsTrainingListItem } from "@/lib/api/schemas";
import { formatDate } from "@/lib/labels";
import { StatusBadge } from "./status-badge";

type TrainingTableProps = {
  items: CmsTrainingListItem[];
};

/** Tabela de treinos do pilar/filtro atual. Server Component (sem interação própria). */
export function TrainingTable({ items }: TrainingTableProps) {
  return (
    <div
      role="region"
      aria-label="Treinos"
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Lista de treinos do pilar selecionado
        </caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
            <th scope="col" className="px-3 py-2 font-medium">
              Ordem
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Código
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Título
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Nível
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Autor
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Atualizado
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/60">
              <td className="px-3 py-2 text-text-muted">{item.order}</td>
              <td className="px-3 py-2 font-mono text-text-muted">
                {item.code}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/treinos/${item.id}`}
                  className="font-medium text-text underline-offset-2 hover:underline focus-visible:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-text-muted">{item.levelLabel}</td>
              <td className="px-3 py-2">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-3 py-2 text-text-muted">
                {item.author?.name ?? "FlowState"}
              </td>
              <td className="px-3 py-2 text-text-muted">
                {formatDate(item.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
