"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { AdminActionResult } from "@/lib/admin-action";

type ConfirmActionProps = {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  /** Server Action já ligada aos argumentos (ex.: `revokeAdminAction.bind(null, id)`). */
  action: () => Promise<AdminActionResult>;
  tone?: "danger" | "neutral";
};

const NEUTRAL_BUTTON =
  "rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary disabled:opacity-60";
const TRIGGER_CLASS = {
  danger:
    "rounded-md border border-danger/60 px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60",
  neutral: NEUTRAL_BUTTON,
} as const;
const CONFIRM_CLASS = {
  danger:
    "rounded-md bg-danger px-3 py-2 text-sm font-medium text-background disabled:opacity-60",
  neutral:
    "rounded-md bg-primary px-3 py-2 text-sm font-medium text-background disabled:opacity-60",
} as const;

/**
 * Confirmação de ação sensível (bloquear, revogar, remover) num `<dialog>`
 * nativo: `showModal()` prende o foco, Esc cancela e o foco inicial fica em
 * Cancelar, o caminho seguro. O erro da action aparece dentro do diálogo,
 * já traduzido do `code` da API. Um ref impede a segunda chamada num clique
 * duplo antes de `pending` chegar ao DOM.
 */
export function ConfirmAction({
  triggerLabel,
  title,
  description,
  confirmLabel,
  action,
  tone = "danger",
}: ConfirmActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const runningRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  function confirm() {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          close();
          return;
        }
        setError(result.error);
      } finally {
        runningRef.current = false;
      }
    });
  }

  return (
    <>
      <button type="button" onClick={open} disabled={pending} className={TRIGGER_CLASS[tone]}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setError(null)}
        className="m-auto w-full max-w-md rounded-md border border-border bg-surface p-5 text-text backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm text-text-muted">
            {description}
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={close}
              disabled={pending}
              className={NEUTRAL_BUTTON}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              aria-busy={pending || undefined}
              className={CONFIRM_CLASS[tone]}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
