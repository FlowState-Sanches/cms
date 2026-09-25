"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  confirmVideoAction,
  removeVideoAction,
  requestVideoUploadAction,
} from "@/app/(cms)/treinos/actions";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_MB,
  putWithProgress,
  type UploadHandle,
} from "@/lib/upload";

type VideoUploaderProps = {
  trainingId: string;
  demoVideoUrl: string | null;
  /** Só quem pode editar o treino no status atual pode enviar ou remover o vídeo. */
  canEdit: boolean;
};

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string }
  | { kind: "success" };

const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const INVALID_FILE_MESSAGE = `Envie um vídeo MP4, MOV ou WEBM de até ${MAX_VIDEO_MB} MB.`;
const UPLOAD_FAILED_MESSAGE =
  "Não foi possível enviar o vídeo. Tente de novo.";

const SECONDARY_BUTTON =
  "min-h-11 w-full rounded-md border border-border px-3 py-2 text-sm text-text hover:border-primary disabled:opacity-60 md:w-auto lg:min-h-0";
const DANGER_BUTTON =
  "min-h-11 w-full rounded-md border border-danger/60 px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60 md:w-auto lg:min-h-0";
/** Botão "escolher arquivo" em largura total e com 44 px no celular; no desktop, o visual atual. */
const FILE_INPUT =
  "w-full min-w-0 text-sm text-text-muted file:mr-3 file:min-h-11 file:w-full file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-text md:file:w-auto lg:file:mr-1 lg:file:min-h-0 lg:file:rounded-none lg:file:border-0 lg:file:bg-transparent lg:file:px-0 lg:file:text-inherit";

function isAcceptedType(
  type: string,
): type is (typeof ACCEPTED_VIDEO_TYPES)[number] {
  return (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(type);
}

/**
 * Envio do vídeo de demonstração direto para o S3 (URL assinada) e remoção.
 * Fluxo (`UploadState`): `idle` → escolhe arquivo → `uploading` (progresso,
 * "Cancelar" aborta) → confirma na API → `success`. Erro em qualquer etapa
 * cai em `error` com "Tentar de novo" (volta a `idle`). Abortar volta a
 * `idle` direto, sem mensagem de erro.
 *
 * Depois de confirmar ou remover, chama `router.refresh()`: a página server
 * component busca o treino de novo e `demoVideoUrl` chega atualizado por
 * prop, sem desmontar o formulário (que mantém suas próprias alterações não
 * salvas, se houver, porque é um componente cliente separado).
 */
export function VideoUploader({
  trainingId,
  demoVideoUrl,
  canEdit,
}: VideoUploaderProps) {
  const router = useRouter();
  const fileInputId = useId();
  const fileHintId = `${fileInputId}-dica`;
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const handleRef = useRef<UploadHandle | null>(null);

  async function handleFile(file: File): Promise<void> {
    if (!isAcceptedType(file.type) || file.size > MAX_VIDEO_BYTES) {
      setState({ kind: "error", message: INVALID_FILE_MESSAGE });
      return;
    }

    setState({ kind: "uploading", progress: 0 });

    const requested = await requestVideoUploadAction(
      trainingId,
      file.type,
      file.size,
    );
    if (!requested.ok) {
      setState({ kind: "error", message: requested.error });
      return;
    }

    const handle = putWithProgress(
      requested.uploadUrl,
      file,
      requested.headers,
      (ratio) =>
        setState((prev) =>
          prev.kind === "uploading" ? { kind: "uploading", progress: ratio } : prev,
        ),
    );
    handleRef.current = handle;

    try {
      await handle.promise;
    } catch (error) {
      handleRef.current = null;
      if (error instanceof Error && error.message === "upload_aborted") {
        setState({ kind: "idle" });
      } else {
        setState({ kind: "error", message: UPLOAD_FAILED_MESSAGE });
      }
      return;
    }
    handleRef.current = null;

    const confirmed = await confirmVideoAction(trainingId, requested.key);
    if (!confirmed.ok) {
      setState({ kind: "error", message: confirmed.error });
      return;
    }
    setState({ kind: "success" });
    router.refresh();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (file) {
      void handleFile(file);
    }
  }

  function handleCancel(): void {
    handleRef.current?.abort();
  }

  function handleRetry(): void {
    setState({ kind: "idle" });
  }

  async function handleConfirmRemove(): Promise<void> {
    setRemovePending(true);
    setRemoveError(null);
    const result = await removeVideoAction(trainingId);
    setRemovePending(false);
    if (!result.ok) {
      setRemoveError(result.error);
      return;
    }
    setConfirmingRemove(false);
    router.refresh();
  }

  const player = demoVideoUrl && (
    <video
      controls
      preload="metadata"
      src={demoVideoUrl}
      className="w-full rounded-md border border-border"
    >
      Seu navegador não suporta a reprodução deste vídeo.
    </video>
  );

  if (!canEdit) {
    return (
      <section
        aria-label="Vídeo de demonstração"
        className="flex flex-col gap-3"
      >
        <h2 className="font-display text-base font-semibold text-text">
          Vídeo de demonstração
        </h2>
        {player ?? (
          <p className="text-sm text-text-muted">Nenhum vídeo enviado.</p>
        )}
      </section>
    );
  }

  return (
    <section
      aria-label="Vídeo de demonstração"
      className="flex flex-col gap-3"
    >
      <h2 className="font-display text-base font-semibold text-text">
        Vídeo de demonstração
      </h2>

      {player}

      {state.kind === "uploading" && (
        <div className="flex flex-col gap-2">
          <progress
            value={Math.round(state.progress * 100)}
            max={100}
            aria-valuenow={Math.round(state.progress * 100)}
            className="w-full"
          >
            {Math.round(state.progress * 100)}%
          </progress>
          <button
            type="button"
            onClick={handleCancel}
            className={SECONDARY_BUTTON}
          >
            Cancelar
          </button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className={SECONDARY_BUTTON}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {state.kind === "success" && (
        <p role="status" className="text-sm text-primary">
          Vídeo enviado.
        </p>
      )}

      {state.kind !== "uploading" && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className="text-sm font-medium text-text"
          >
            Enviar novo vídeo
          </label>
          <input
            id={fileInputId}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES.join(",")}
            onChange={handleInputChange}
            aria-describedby={fileHintId}
            className={FILE_INPUT}
          />
          <p id={fileHintId} className="text-xs text-text-muted">
            {`Formatos aceitos: MP4, MOV ou WEBM. Tamanho máximo: ${MAX_VIDEO_MB} MB.`}
          </p>
        </div>
      )}

      {demoVideoUrl && state.kind !== "uploading" && (
        <div className="flex flex-col gap-2">
          {confirmingRemove ? (
            <div className="flex flex-col gap-2 rounded-md border border-danger/40 bg-danger-soft p-3">
              <p className="text-sm text-text">
                Remover o vídeo de demonstração? Esta ação não pode ser
                desfeita.
              </p>
              {removeError && (
                <p role="alert" className="text-sm text-danger">
                  {removeError}
                </p>
              )}
              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={removePending}
                  className={SECONDARY_BUTTON}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={removePending}
                  aria-busy={removePending || undefined}
                  className={DANGER_BUTTON}
                >
                  Confirmar remoção
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              className={DANGER_BUTTON}
            >
              Remover vídeo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
