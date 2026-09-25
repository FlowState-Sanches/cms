"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import {
  useForm,
  useWatch,
  type FieldError,
  type Path,
  type UseFormRegisterReturn,
} from "react-hook-form";
import type { ActionResult } from "@/app/(cms)/treinos/actions";
import {
  TRAINING_LIMITS as L,
  type PillarKey,
  type TrainingStatus,
} from "@/lib/api/schemas";
import {
  trainingFormSchema,
  type TrainingFormValues,
} from "@/lib/training-schema";
import { StringListField } from "./string-list-field";

export type PillarOption = { key: PillarKey; label: string };

type TrainingFormProps = {
  mode: "create" | "edit";
  defaultValues: TrainingFormValues;
  pillarOptions: PillarOption[];
  /** Chamado com os valores já validados. Um `ActionResult` com erro é exibido no formulário. */
  onSubmit: (values: TrainingFormValues) => Promise<ActionResult | void>;
  /** Usuário sem permissão de edição: mostra os valores sem inputs editáveis. */
  readOnly?: boolean;
  /** Alunos já concluíram: perguntas da autoavaliação ficam travadas. */
  hasCompletions?: boolean;
  /** Status atual do treino (só edição): `published` mostra aviso perto do botão de salvar. */
  status?: TrainingStatus;
  /** Avisado quando o formulário passa a ter (ou deixa de ter) alterações não salvas. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Avisado a cada mudança de valor, para a prévia mobile (B5) ficar ao vivo. */
  onValuesChange?: (values: TrainingFormValues) => void;
};

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus-visible:border-primary aria-invalid:border-danger";
const SECTION_CLASS = "flex flex-col gap-4 rounded-md border border-border p-4";
const LEGEND_CLASS = "px-1 font-display text-base font-semibold text-text";

const SUBMIT_LABELS = {
  create: "Salvar rascunho",
  edit: "Salvar alterações",
} as const;

function fieldId(name: string): string {
  return `treino-${name.replace(/\./g, "-")}`;
}

type FieldProps = {
  name: Path<TrainingFormValues>;
  label: string;
  error?: FieldError;
  hint?: ReactNode;
  children: (props: {
    id: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  }) => ReactNode;
};

/** Label + controle + dica + erro, com `aria-describedby` ligando tudo. */
function Field({ name, label, error, hint, children }: FieldProps) {
  const id = fieldId(name);
  const hintId = `${id}-dica`;
  const errorId = `${id}-erro`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error?.message && (
        <p id={errorId} className="text-xs text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}

function TextInput(
  props: UseFormRegisterReturn & {
    id: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
    className?: string;
  },
) {
  return (
    <input type="text" {...props} className={props.className ?? INPUT_CLASS} />
  );
}

/**
 * Formulário de treino (criação e edição). Valida no cliente com o mesmo
 * schema que a Server Action revalida no servidor. Foco vai para o primeiro
 * campo com erro; erros de campo do servidor entram via `setError`; a
 * mensagem geral fica em `role="alert"`.
 */
export function TrainingForm({
  mode,
  defaultValues,
  pillarOptions,
  onSubmit,
  readOnly = false,
  hasCompletions = false,
  status,
  onDirtyChange,
  onValuesChange,
}: TrainingFormProps) {
  if (readOnly) {
    return (
      <TrainingReadOnlyView
        values={defaultValues}
        pillarOptions={pillarOptions}
      />
    );
  }
  return (
    <EditableTrainingForm
      mode={mode}
      defaultValues={defaultValues}
      pillarOptions={pillarOptions}
      onSubmit={onSubmit}
      hasCompletions={hasCompletions}
      status={status}
      onDirtyChange={onDirtyChange}
      onValuesChange={onValuesChange}
    />
  );
}

function EditableTrainingForm({
  mode,
  defaultValues,
  pillarOptions,
  onSubmit,
  hasCompletions,
  status,
  onDirtyChange,
  onValuesChange,
}: Omit<TrainingFormProps, "readOnly"> & { hasCompletions: boolean }) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues,
    shouldFocusError: true,
  });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Aviso nativo do navegador ao sair da página com alterações não salvas.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const summary = useWatch({ control, name: "summary" }) ?? "";
  const referenceEnabled = useWatch({ control, name: "reference.enabled" });
  const watchedValues = useWatch({ control });

  useEffect(() => {
    onValuesChange?.(watchedValues as TrainingFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues]);

  const submit = handleSubmit(async (values) => {
    setGeneralError(null);
    setSavedMessage(null);
    const result = await onSubmit(values);
    if (!result) {
      return;
    }
    if (result.ok) {
      reset(values);
      setSavedMessage("Alterações salvas.");
      return;
    }
    setGeneralError(result.error);
    const fieldErrors = Object.entries(result.fieldErrors ?? {});
    for (const [key, message] of fieldErrors) {
      setError(key as Path<TrainingFormValues>, { type: "server", message });
    }
    const firstField = fieldErrors[0]?.[0];
    if (firstField) {
      setFocus(firstField as Path<TrainingFormValues>);
    }
  });

  const pillarLabel =
    pillarOptions.find((option) => option.key === defaultValues.pillar)
      ?.label ?? defaultValues.pillar;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Identificação</legend>

        {mode === "create" ? (
          <Field name="pillar" label="Pilar" error={errors.pillar}>
            {(a11y) => (
              <select {...a11y} {...register("pillar")} className={INPUT_CLASS}>
                {pillarOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Pilar</span>
            <p className="text-sm text-text-muted">
              {pillarLabel} (não pode ser alterado)
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            name="code"
            label="Código"
            error={errors.code}
            hint="Até 10 letras ou números. Salvo em maiúsculas."
          >
            {(a11y) => (
              <TextInput
                {...a11y}
                {...register("code")}
                className={`${INPUT_CLASS} font-mono uppercase`}
              />
            )}
          </Field>
          <Field name="levelLabel" label="Nível" error={errors.levelLabel}>
            {(a11y) => <TextInput {...a11y} {...register("levelLabel")} />}
          </Field>
        </div>

        <Field name="title" label="Título" error={errors.title}>
          {(a11y) => <TextInput {...a11y} {...register("title")} />}
        </Field>
        <Field name="subtitle" label="Subtítulo" error={errors.subtitle}>
          {(a11y) => <TextInput {...a11y} {...register("subtitle")} />}
        </Field>
        <Field
          name="durationMinutes"
          label="Duração (minutos)"
          error={errors.durationMinutes}
        >
          {(a11y) => (
            <input
              type="number"
              inputMode="numeric"
              min={L.durationMinutes.min}
              max={L.durationMinutes.max}
              step={1}
              {...a11y}
              {...register("durationMinutes", { valueAsNumber: true })}
              className={`${INPUT_CLASS} md:w-40`}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Conteúdo</legend>
        <Field
          name="summary"
          label="Resumo"
          error={errors.summary}
          hint={`${summary.length} de ${L.summary.max} caracteres`}
        >
          {(a11y) => (
            <textarea
              rows={5}
              {...a11y}
              {...register("summary")}
              className={INPUT_CLASS}
            />
          )}
        </Field>
        <StringListField
          control={control}
          register={register}
          name="learnings"
          legend="Aprendizados"
          itemLabel="aprendizado"
          addLabel="Adicionar aprendizado"
          min={L.learnings.minItems}
          max={L.learnings.maxItems}
        />
      </fieldset>

      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Coach</legend>
        <Field
          name="coach.quote"
          label="Frase do coach"
          error={errors.coach?.quote}
        >
          {(a11y) => (
            <textarea
              rows={3}
              {...a11y}
              {...register("coach.quote")}
              className={INPUT_CLASS}
            />
          )}
        </Field>
        <Field
          name="coach.author"
          label="Autor da frase"
          error={errors.coach?.author}
        >
          {(a11y) => <TextInput {...a11y} {...register("coach.author")} />}
        </Field>
      </fieldset>

      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Desbloqueio</legend>
        <Field
          name="unlockHint"
          label="Dica de desbloqueio"
          error={errors.unlockHint}
        >
          {(a11y) => <TextInput {...a11y} {...register("unlockHint")} />}
        </Field>
      </fieldset>

      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Autoavaliação</legend>
        {hasCompletions && (
          <p className="rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-text">
            Alunos já responderam esta autoavaliação. As perguntas não podem ser
            alteradas.
          </p>
        )}
        <StringListField
          control={control}
          register={register}
          name="selfAssessment"
          legend="Perguntas"
          itemLabel="pergunta"
          addLabel="Adicionar pergunta"
          min={L.selfAssessment.minItems}
          max={L.selfAssessment.maxItems}
          readOnly={hasCompletions}
        />
      </fieldset>

      <fieldset className={SECTION_CLASS}>
        <legend className={LEGEND_CLASS}>Referência externa</legend>
        <div className="flex items-center gap-2">
          <input
            id={fieldId("reference.enabled")}
            type="checkbox"
            {...register("reference.enabled")}
            className="h-4 w-4 accent-primary"
          />
          <label
            htmlFor={fieldId("reference.enabled")}
            className="text-sm text-text"
          >
            Incluir referência externa
          </label>
        </div>
        {referenceEnabled && (
          <div className="flex flex-col gap-4">
            <Field
              name="reference.title"
              label="Título da referência"
              error={errors.reference?.title}
            >
              {(a11y) => (
                <TextInput {...a11y} {...register("reference.title")} />
              )}
            </Field>
            <Field
              name="reference.provider"
              label="Fonte"
              error={errors.reference?.provider}
            >
              {(a11y) => (
                <TextInput {...a11y} {...register("reference.provider")} />
              )}
            </Field>
            <Field
              name="reference.url"
              label="Link"
              error={errors.reference?.url}
              hint="Use um endereço que comece com https://"
            >
              {(a11y) => (
                <input
                  type="url"
                  {...a11y}
                  {...register("reference.url")}
                  className={INPUT_CLASS}
                />
              )}
            </Field>
          </div>
        )}
      </fieldset>

      {generalError && (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {generalError}
        </p>
      )}
      {savedMessage && (
        <p role="status" className="text-sm text-primary">
          {savedMessage}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {mode === "edit" && status === "published" && (
          <p className="text-sm text-text-muted">
            Este treino está publicado. As alterações aparecem no app assim
            que você salvar.
          </p>
        )}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
            className="min-h-11 w-full rounded-md bg-primary px-4 py-2 font-medium text-background disabled:opacity-60 md:w-auto lg:min-h-0"
          >
            {SUBMIT_LABELS[mode]}
          </button>
        </div>
      </div>
    </form>
  );
}

type ReadOnlyItem = { label: string; value: ReactNode };

function ReadOnlySection({
  title,
  items,
}: {
  title: string;
  items: ReadOnlyItem[];
}) {
  return (
    <section className={SECTION_CLASS} aria-label={title}>
      <h2 className={LEGEND_CLASS}>{title}</h2>
      <dl className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-text-muted">
              {item.label}
            </dt>
            <dd className="text-sm text-text">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function List({ items }: { items: { value: string }[] }) {
  return (
    <ol className="list-decimal pl-5">
      {items.map((item, index) => (
        <li key={index}>{item.value}</li>
      ))}
    </ol>
  );
}

/** Visualização sem inputs para quem não pode editar o treino no status atual. */
function TrainingReadOnlyView({
  values,
  pillarOptions,
}: {
  values: TrainingFormValues;
  pillarOptions: PillarOption[];
}) {
  const pillarLabel =
    pillarOptions.find((option) => option.key === values.pillar)?.label ??
    values.pillar;

  return (
    <div className="flex flex-col gap-6">
      <ReadOnlySection
        title="Identificação"
        items={[
          { label: "Pilar", value: pillarLabel },
          {
            label: "Código",
            value: <span className="font-mono">{values.code}</span>,
          },
          { label: "Título", value: values.title },
          { label: "Subtítulo", value: values.subtitle },
          { label: "Nível", value: values.levelLabel },
          {
            label: "Duração (minutos)",
            value: `${values.durationMinutes} min`,
          },
        ]}
      />
      <ReadOnlySection
        title="Conteúdo"
        items={[
          {
            label: "Resumo",
            value: (
              <span className="whitespace-pre-line">{values.summary}</span>
            ),
          },
          { label: "Aprendizados", value: <List items={values.learnings} /> },
        ]}
      />
      <ReadOnlySection
        title="Coach"
        items={[
          { label: "Frase do coach", value: values.coach.quote },
          { label: "Autor da frase", value: values.coach.author },
        ]}
      />
      <ReadOnlySection
        title="Desbloqueio"
        items={[{ label: "Dica de desbloqueio", value: values.unlockHint }]}
      />
      <ReadOnlySection
        title="Autoavaliação"
        items={[
          { label: "Perguntas", value: <List items={values.selfAssessment} /> },
        ]}
      />
      <ReadOnlySection
        title="Referência externa"
        items={
          values.reference.enabled
            ? [
                {
                  label: "Título da referência",
                  value: values.reference.title,
                },
                { label: "Fonte", value: values.reference.provider },
                {
                  label: "Link",
                  value: (
                    <a
                      href={values.reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary underline-offset-2 hover:underline"
                    >
                      {values.reference.url}
                    </a>
                  ),
                },
              ]
            : [{ label: "Referência", value: "Sem referência externa." }]
        }
      />
    </div>
  );
}
