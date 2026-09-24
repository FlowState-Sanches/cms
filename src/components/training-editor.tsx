"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import {
  createTrainingAction,
  updateTrainingAction,
} from "@/app/(cms)/treinos/actions";
import type { TrainingFormValues } from "@/lib/training-schema";
import { MobilePreview } from "./mobile-preview";
import { StatusActions } from "./status-actions";
import { TrainingForm, type PillarOption } from "./training-form";
import { VideoUploader } from "./video-uploader";

type CreateEditorProps = {
  mode: "create";
  defaultValues: TrainingFormValues;
  pillarOptions: PillarOption[];
};

type EditEditorProps = {
  mode: "edit";
  trainingId: string;
  defaultValues: TrainingFormValues;
  pillarOptions: PillarOption[];
  readOnly: boolean;
  hasCompletions: boolean;
  /** Dados das ações de status. O editor renderiza `StatusActions` para bloqueá-las enquanto há alterações não salvas. */
  statusActions: Omit<
    ComponentProps<typeof StatusActions>,
    "hasUnsavedChanges"
  >;
  /** Coluna lateral (histórico). B5 acrescenta aqui MobilePreview e VideoUploader. */
  sidebar?: ReactNode;
  /** Reservado para a B5 (VideoUploader/MobilePreview). Ainda não usado. */
  demoVideoUrl: string | null;
  /** Reservado para a B5 (VideoUploader). Ainda não usado. */
  hasVideo: boolean;
};

type TrainingEditorProps = CreateEditorProps | EditEditorProps;

/**
 * Wrapper cliente dono do formulário de treino. Liga o formulário às Server
 * Actions e organiza o layout (coluna principal + coluna lateral). Fica no
 * cliente para que a B5 possa pôr a prévia ao vivo e o upload de vídeo ao
 * lado do formulário, compartilhando estado com ele.
 */
export function TrainingEditor(props: TrainingEditorProps) {
  return props.mode === "create" ? (
    <CreateEditor {...props} />
  ) : (
    <EditEditor {...props} />
  );
}

function CreateEditor({ defaultValues, pillarOptions }: CreateEditorProps) {
  return (
    <div className="max-w-3xl">
      <TrainingForm
        mode="create"
        defaultValues={defaultValues}
        pillarOptions={pillarOptions}
        onSubmit={(values) => createTrainingAction(values)}
      />
    </div>
  );
}

function EditEditor({
  trainingId,
  defaultValues,
  pillarOptions,
  readOnly,
  hasCompletions,
  statusActions,
  sidebar,
  demoVideoUrl,
}: EditEditorProps) {
  // Mudança de status com edições pendentes descartaria as edições em silêncio.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Prévia mobile ao vivo: some enquanto o formulário é só leitura, os
  // valores nunca mudam, então `defaultValues` já é a prévia certa.
  const [previewValues, setPreviewValues] =
    useState<TrainingFormValues>(defaultValues);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <StatusActions
          {...statusActions}
          hasUnsavedChanges={!readOnly && hasUnsavedChanges}
        />
        <TrainingForm
          mode="edit"
          defaultValues={defaultValues}
          pillarOptions={pillarOptions}
          readOnly={readOnly}
          hasCompletions={hasCompletions}
          status={statusActions.training.status}
          onDirtyChange={setHasUnsavedChanges}
          onValuesChange={setPreviewValues}
          onSubmit={(values) => updateTrainingAction(trainingId, values)}
        />
      </div>
      <aside aria-label="Informações do treino" className="flex flex-col gap-6">
        <VideoUploader
          trainingId={trainingId}
          demoVideoUrl={demoVideoUrl}
          canEdit={!readOnly}
        />
        <MobilePreview values={previewValues} demoVideoUrl={demoVideoUrl} />
        {sidebar}
      </aside>
    </div>
  );
}
