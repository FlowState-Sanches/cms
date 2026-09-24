"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import type { ActionResult } from "@/app/(cms)/treinos/actions";
import type { CmsTrainingListItem, PillarKey } from "@/lib/api/schemas";
import { StatusBadge } from "./status-badge";

type ReorderListProps = {
  pillar: PillarKey;
  /** Treinos do pilar (qualquer status vindo da API). Arquivados são filtrados aqui. */
  items: CmsTrainingListItem[];
  /** Salva a nova ordem (`reorderAction` já com o pilar preso via `.bind`). */
  onSave: (ids: string[]) => Promise<ActionResult>;
};

type SaveStatus = { kind: "success" | "error"; message: string };

const MOVE_BUTTON =
  "rounded-md border border-border px-2 py-1 text-xs text-text hover:border-primary disabled:opacity-40";
const PRIMARY_BUTTON =
  "rounded-md bg-primary px-3 py-2 text-sm font-medium text-background disabled:opacity-60";
const SECONDARY_BUTTON =
  "rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary disabled:opacity-60";

function sortByOrder(items: CmsTrainingListItem[]): CmsTrainingListItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function nonArchived(items: CmsTrainingListItem[]): CmsTrainingListItem[] {
  return sortByOrder(items.filter((item) => item.status !== "archived"));
}

function sameOrder(
  a: CmsTrainingListItem[],
  b: CmsTrainingListItem[],
): boolean {
  return a.length === b.length && a.every((item, index) => item.id === b[index]?.id);
}

/**
 * Lista reordenável de treinos de um pilar (fila `/pilares/[key]/ordem`).
 * Cada item tem botões "Mover <título> para cima/baixo" (o primeiro não tem
 * "para cima", o último não tem "para baixo") e responde a `Alt+ArrowUp`/
 * `Alt+ArrowDown` com o item focado. Uma região `aria-live="polite"`
 * anuncia a nova posição a cada movimento. "Salvar ordem" e "Desfazer" só
 * ficam habilitados quando a ordem muda; salvar chama `onSave` (que já é a
 * `reorderAction` do servidor, com o pilar preso) e mostra "Ordem salva."
 * ou o erro devolvido.
 */
export function ReorderList({ pillar, items, onSave }: ReorderListProps) {
  const [original, setOriginal] = useState(() => nonArchived(items));
  const [order, setOrder] = useState(original);
  const [announcement, setAnnouncement] = useState("");
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [pending, startTransition] = useTransition();

  const changed = !sameOrder(order, original);

  function move(id: string, direction: -1 | 1) {
    setStatus(null);
    setOrder((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) {
        return prev;
      }
      const moved = prev[index];
      if (!moved) {
        return prev;
      }
      const next = [...prev];
      next.splice(index, 1);
      next.splice(target, 0, moved);
      setAnnouncement(
        `${moved.title} agora na posição ${target + 1} de ${next.length}`,
      );
      return next;
    });
  }

  function handleKeyDown(id: string, event: KeyboardEvent<HTMLLIElement>) {
    if (!event.altKey) {
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(id, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      move(id, 1);
    }
  }

  function handleUndo() {
    setOrder(original);
    setStatus(null);
    setAnnouncement("Ordem original restaurada.");
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(order.map((item) => item.id));
      if (result.ok) {
        setStatus({ kind: "success", message: "Ordem salva." });
        setOriginal(order);
      } else {
        setStatus({ kind: "error", message: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ol aria-label={`Ordem dos treinos do pilar ${pillar}`} className="flex flex-col gap-2">
        {order.map((item, index) => (
          <li
            key={item.id}
            tabIndex={0}
            onKeyDown={(event) => handleKeyDown(item.id, event)}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-sm text-text-muted">{index + 1}</span>
              <span className="font-medium text-text">{item.title}</span>
              <StatusBadge status={item.status} />
            </div>
            <div className="flex gap-1">
              {index > 0 && (
                <button
                  type="button"
                  className={MOVE_BUTTON}
                  onClick={() => move(item.id, -1)}
                >
                  Mover {item.title} para cima
                </button>
              )}
              {index < order.length - 1 && (
                <button
                  type="button"
                  className={MOVE_BUTTON}
                  onClick={() => move(item.id, 1)}
                >
                  Mover {item.title} para baixo
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={PRIMARY_BUTTON}
          disabled={!changed || pending}
          aria-busy={pending || undefined}
          onClick={handleSave}
        >
          Salvar ordem
        </button>
        <button
          type="button"
          className={SECONDARY_BUTTON}
          disabled={!changed || pending}
          onClick={handleUndo}
        >
          Desfazer
        </button>
      </div>

      {status && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={
            status.kind === "error"
              ? "text-sm text-danger"
              : "text-sm text-text-muted"
          }
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
