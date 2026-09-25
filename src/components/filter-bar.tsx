import Link from "next/link";
import type { FilterOption } from "@/lib/admin-labels";

export type FilterField =
  | { kind: "search"; name: string; label: string; value?: string }
  | { kind: "date"; name: string; label: string; value?: string }
  | {
      kind: "select";
      name: string;
      label: string;
      value?: string;
      options: FilterOption[];
    }
  | { kind: "hidden"; name: string; value: string };

type FilterBarProps = {
  label: string;
  action: string;
  fields: FilterField[];
};

const INPUT =
  "min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-primary md:w-auto lg:min-h-0";

/**
 * Filtros como `<form method="get">`: o estado vive na URL, funciona sem JS
 * e cada combinação é um link que se compartilha. `pagina` não é campo do
 * form, então filtrar volta para a página 1. Abaixo de 768 px os campos e o
 * botão Filtrar ocupam a largura toda (spec 5.5).
 */
export function FilterBar({ label, action, fields }: FilterBarProps) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label={label}
      className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
    >
      {fields.map((field) => {
        if (field.kind === "hidden") {
          return (
            <input key={field.name} type="hidden" name={field.name} defaultValue={field.value} />
          );
        }
        const id = `filtro-${field.name}`;
        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-medium text-text-muted">
              {field.label}
            </label>
            {field.kind === "select" ? (
              <select id={id} name={field.name} defaultValue={field.value ?? ""} className={INPUT}>
                <option value="">Todos</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                name={field.name}
                type={field.kind === "date" ? "date" : "search"}
                defaultValue={field.value ?? ""}
                maxLength={field.kind === "search" ? 100 : undefined}
                className={INPUT}
              />
            )}
          </div>
        );
      })}
      <button
        type="submit"
        className="min-h-11 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-background md:w-auto lg:min-h-0"
      >
        Filtrar
      </button>
      <Link
        href={action}
        className="inline-flex min-h-11 items-center justify-center px-1 py-2 text-sm text-text-muted hover:text-text md:justify-start lg:min-h-0"
      >
        Limpar filtros
      </Link>
    </form>
  );
}
