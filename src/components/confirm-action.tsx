"use client";

import { useId, useRef, useState } from "react";
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

/** Abaixo de 768 px o botão ocupa a largura toda; abaixo de 1024 px tem 44 px de altura. */
const TOUCH = "min-h-11 w-full md:w-auto lg:min-h-0";
const NEUTRAL_BUTTON = `rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary disabled:opacity-60 ${TOUCH}`;
const TRIGGER_CLASS = {
  danger: `rounded-md border border-danger/60 px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60 ${TOUCH}`,
  neutral: NEUTRAL_BUTTON,
} as const;
const CONFIRM_CLASS = {
  danger: `rounded-md bg-danger px-3 py-2 text-sm font-medium text-background disabled:opacity-60 ${TOUCH}`,
  neutral: `rounded-md bg-primary px-3 py-2 text-sm font-medium text-background disabled:opacity-60 ${TOUCH}`,
} as const;
/** Cabe em 360 px (margem de 1rem de cada lado) e rola por dentro se o conteúdo passar da altura. */
const DIALOG_CLASS =
  "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-md border border-border bg-surface p-5 text-text backdrop:bg-black/60 md:w-full";

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
  const [pending, setPending] = useState(false);
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
    setPending(true);
    void (async () => {
      try {
        const result = await action();
        if (result.ok) {
          setPending(false);
          close();
          return;
        }
        // `setPending` e `setError` juntos no mesmo tick: o botão Cancelar
        // reabilita no mesmo commit em que o erro aparece.
        setPending(false);
        setError(result.error);
      } finally {
        runningRef.current = false;
      }
    })();
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
        onCancel={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
        onClose={() => setError(null)}
        className={DIALOG_CLASS}
      >
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm text-text-muted wrap-anywhere">
            {description}
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger wrap-anywhere">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
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
