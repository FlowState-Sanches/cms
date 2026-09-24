"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from "react";
import {
  deleteTrainingAction,
  giveBackAction,
  transitionAction,
  type ActionResult,
} from "@/app/(cms)/treinos/actions";
import {
  TRAINING_LIMITS,
  type CmsAccess,
  type CmsTraining,
} from "@/lib/api/schemas";
import {
  availableStatusActions,
  type StatusActionKey,
} from "@/lib/permissions";

type StatusActionsProps = {
  training: Pick<
    CmsTraining,
    "id" | "status" | "author" | "publishedAt" | "hasCompletions"
  >;
  access: CmsAccess;
  /** Formulário com alterações não salvas: mudanças de status ficam bloqueadas até salvar. */
  hasUnsavedChanges?: boolean;
};

type DialogKey = "devolver" | "arquivar" | "desarquivar" | "excluir";

const ACTION_LABELS: Record<StatusActionKey, string> = {
  submeter: "Enviar para revisão",
  publicar: "Publicar",
  devolver: "Devolver",
  despublicar: "Despublicar",
  arquivar: "Arquivar",
  desarquivar: "Desarquivar",
  excluir: "Excluir",
};

const DIRECT_TRANSITIONS: Partial<
  Record<StatusActionKey, "submeter" | "publicar" | "despublicar">
> = { submeter: "submeter", publicar: "publicar", despublicar: "despublicar" };

const PRIMARY_BUTTON =
  "rounded-md bg-primary px-3 py-2 text-sm font-medium text-background disabled:opacity-60";
const SECONDARY_BUTTON =
  "rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary disabled:opacity-60";
const DANGER_BUTTON =
  "rounded-md border border-danger/60 px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60";

const COMMENT = TRAINING_LIMITS.giveBackComment;
const COMMENT_MESSAGE = `Escreva um comentário de ${COMMENT.min} a ${COMMENT.max} caracteres.`;

/**
 * Botões de mudança de status do treino, calculados pela matriz de permissão
 * do Contrato (a API revalida tudo). Devolver, Arquivar, Desarquivar e Excluir abrem um
 * `<dialog>` nativo com `showModal()`: o navegador prende o foco dentro do
 * diálogo e Esc cancela.
 */
export function StatusActions({
  training,
  access,
  hasUnsavedChanges = false,
}: StatusActionsProps) {
  const available = availableStatusActions(training, access);
  const unsavedHintId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const giveBackDialogRef = useRef<HTMLDialogElement>(null);
  const archiveDialogRef = useRef<HTMLDialogElement>(null);
  const unarchiveDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const archiveCancelRef = useRef<HTMLButtonElement>(null);
  const unarchiveCancelRef = useRef<HTMLButtonElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  // Só chamado em handlers de evento (nunca durante o render).
  function dialogFor(key: DialogKey): HTMLDialogElement | null {
    if (key === "devolver") return giveBackDialogRef.current;
    if (key === "arquivar") return archiveDialogRef.current;
    if (key === "desarquivar") return unarchiveDialogRef.current;
    return deleteDialogRef.current;
  }

  if (available.length === 0) {
    return null;
  }

  function openDialog(key: DialogKey) {
    setError(null);
    setDialogError(null);
    setCommentError(null);
    dialogFor(key)?.showModal();
    if (key === "devolver") {
      commentRef.current?.focus();
    } else if (key === "arquivar") {
      archiveCancelRef.current?.focus();
    } else if (key === "desarquivar") {
      unarchiveCancelRef.current?.focus();
    } else {
      deleteCancelRef.current?.focus();
    }
  }

  function closeDialog(key: DialogKey) {
    dialogFor(key)?.close();
  }

  function run(call: () => Promise<ActionResult>, dialog?: DialogKey) {
    startTransition(async () => {
      const result = await call();
      if (result.ok) {
        if (dialog) {
          closeDialog(dialog);
        }
        return;
      }
      if (dialog) {
        setDialogError(result.error);
        if (dialog === "devolver" && result.fieldErrors?.comment) {
          setCommentError(result.fieldErrors.comment);
        }
      } else {
        setError(result.error);
      }
    });
  }

  function handleClick(action: StatusActionKey) {
    const direct = DIRECT_TRANSITIONS[action];
    if (direct) {
      setError(null);
      run(() => transitionAction(training.id, direct));
      return;
    }
    openDialog(action as DialogKey);
  }

  function confirmGiveBack() {
    const trimmed = comment.trim();
    if (trimmed.length < COMMENT.min || trimmed.length > COMMENT.max) {
      setCommentError(COMMENT_MESSAGE);
      commentRef.current?.focus();
      return;
    }
    setCommentError(null);
    run(() => giveBackAction(training.id, trimmed), "devolver");
  }

  return (
    <section aria-label="Ações de status" className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending || hasUnsavedChanges}
            aria-describedby={hasUnsavedChanges ? unsavedHintId : undefined}
            onClick={() => handleClick(action)}
            className={
              action === "excluir" || action === "arquivar"
                ? DANGER_BUTTON
                : action === "publicar" || action === "submeter"
                  ? PRIMARY_BUTTON
                  : SECONDARY_BUTTON
            }
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {hasUnsavedChanges && (
        <p id={unsavedHintId} className="text-sm text-text-muted">
          Salve as alterações antes de mudar o status.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {available.includes("devolver") && (
        <ConfirmDialog
          dialogRef={giveBackDialogRef}
          title="Devolver para o autor"
          error={dialogError}
          pending={pending}
          confirmLabel="Confirmar devolução"
          onConfirm={confirmGiveBack}
          onCancel={() => closeDialog("devolver")}
          onClose={() => {
            setComment("");
            setCommentError(null);
            setDialogError(null);
          }}
        >
          <p className="text-sm text-text-muted">
            O treino volta para rascunho e o autor vê o seu comentário.
          </p>
          <CommentField
            textareaRef={commentRef}
            value={comment}
            onChange={setComment}
            error={commentError}
          />
        </ConfirmDialog>
      )}

      {available.includes("arquivar") && (
        <ConfirmDialog
          dialogRef={archiveDialogRef}
          cancelRef={archiveCancelRef}
          title="Arquivar treino"
          error={dialogError}
          pending={pending}
          confirmLabel="Confirmar arquivamento"
          onConfirm={() =>
            run(() => transitionAction(training.id, "arquivar"), "arquivar")
          }
          onCancel={() => closeDialog("arquivar")}
          onClose={() => setDialogError(null)}
        >
          <p className="text-sm text-text-muted">
            O treino sai do app dos alunos e não pode mais ser editado até a
            curadoria desarquivar.
          </p>
        </ConfirmDialog>
      )}

      {available.includes("desarquivar") && (
        <ConfirmDialog
          dialogRef={unarchiveDialogRef}
          cancelRef={unarchiveCancelRef}
          title="Desarquivar treino"
          error={dialogError}
          pending={pending}
          confirmLabel="Confirmar desarquivamento"
          onConfirm={() =>
            run(
              () => transitionAction(training.id, "desarquivar"),
              "desarquivar",
            )
          }
          onCancel={() => closeDialog("desarquivar")}
          onClose={() => setDialogError(null)}
        >
          <p className="text-sm text-text-muted">
            O treino volta como rascunho, no fim do pilar, e só reaparece no app
            depois de publicado de novo.
          </p>
        </ConfirmDialog>
      )}

      {available.includes("excluir") && (
        <ConfirmDialog
          dialogRef={deleteDialogRef}
          cancelRef={deleteCancelRef}
          title="Excluir treino"
          error={dialogError}
          pending={pending}
          confirmLabel="Confirmar exclusão"
          onConfirm={() =>
            run(() => deleteTrainingAction(training.id), "excluir")
          }
          onCancel={() => closeDialog("excluir")}
          onClose={() => setDialogError(null)}
        >
          <p className="text-sm text-text-muted">
            O rascunho será excluído definitivamente. Essa ação não pode ser
            desfeita.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}

type ConfirmDialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  cancelRef?: RefObject<HTMLButtonElement | null>;
  title: string;
  error: string | null;
  pending: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
  children: ReactNode;
};

function ConfirmDialog({
  dialogRef,
  cancelRef,
  title,
  error,
  pending,
  confirmLabel,
  onConfirm,
  onCancel,
  onClose,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-md border border-border bg-surface p-5 text-text backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="font-display text-lg font-semibold">
          {title}
        </h2>
        {children}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={SECONDARY_BUTTON}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending || undefined}
            className={DANGER_BUTTON}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function CommentField({
  textareaRef,
  value,
  onChange,
  error,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}) {
  const id = useId();
  const hintId = `${id}-dica`;
  const errorId = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Comentário para o autor
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        rows={4}
        required
        maxLength={COMMENT.max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, error ? errorId : null]
          .filter(Boolean)
          .join(" ")}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-text outline-none focus-visible:border-primary aria-invalid:border-danger"
      />
      <p id={hintId} className="text-xs text-text-muted">
        {value.trim().length} de {COMMENT.max} caracteres (mínimo {COMMENT.min})
      </p>
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
