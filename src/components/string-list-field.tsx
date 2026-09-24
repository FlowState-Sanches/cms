"use client";

import { useEffect, useId, useRef } from "react";
import {
  useFieldArray,
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type { TrainingFormValues } from "@/lib/training-schema";

type ListName = "learnings" | "selfAssessment";

type StringListFieldProps = {
  control: Control<TrainingFormValues>;
  register: UseFormRegister<TrainingFormValues>;
  name: ListName;
  /** Título do grupo (`<legend>`), ex.: "Aprendizados". */
  legend: string;
  /** Nome do item em minúsculas, usado nos rótulos: "aprendizado" → "Aprendizado 2", "Mover aprendizado 2 para cima". */
  itemLabel: string;
  addLabel: string;
  min: number;
  max: number;
  /** Trava edição e reordenação. Usa `readOnly` (não `disabled`) para o valor seguir no envio. */
  readOnly?: boolean;
  /** Texto de apoio exibido abaixo da legenda. */
  description?: string;
};

type PendingFocus = {
  kind: "input" | "up" | "down" | "add";
  index: number;
} | null;

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus-visible:border-primary read-only:opacity-70 aria-invalid:border-danger";
const ICON_BUTTON_CLASS =
  "rounded-md border border-border px-2 py-1 text-xs text-text hover:border-primary disabled:cursor-not-allowed disabled:opacity-40";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Lista dinâmica de textos (aprendizados, perguntas de autoavaliação).
 * Acessível por teclado: cada ação tem rótulo explícito com a posição do
 * item, e o foco acompanha a ação (novo campo, botão movido, vizinho do
 * removido) para quem navega sem mouse ou com leitor de tela.
 */
export function StringListField({
  control,
  register,
  name,
  legend,
  itemLabel,
  addLabel,
  min,
  max,
  readOnly = false,
  description,
}: StringListFieldProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const { errors } = useFormState({ control, name });
  const baseId = useId();
  const containerRef = useRef<HTMLFieldSetElement>(null);
  const pendingFocus = useRef<PendingFocus>(null);

  const listError = errors[name];
  const listMessage = listError?.message ?? listError?.root?.message;
  const listErrorId = `${baseId}-erro`;
  const descriptionId = `${baseId}-descricao`;
  const label = capitalize(itemLabel);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target || !containerRef.current) {
      return;
    }
    pendingFocus.current = null;
    const byKey = (key: string) =>
      containerRef.current?.querySelector<HTMLElement>(
        `[data-focus-key="${key}"]`,
      );
    const preferred = byKey(`${target.kind}-${target.index}`);
    const element =
      preferred && !(preferred as HTMLButtonElement).disabled
        ? preferred
        : (byKey(`input-${target.index}`) ?? byKey("add-0"));
    element?.focus();
  }, [fields]);

  return (
    <fieldset
      ref={containerRef}
      className="flex flex-col gap-3"
      aria-describedby={
        [description ? descriptionId : null, listMessage ? listErrorId : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      <legend className="text-sm font-medium text-text">{legend}</legend>
      {description && (
        <p id={descriptionId} className="text-xs text-text-muted">
          {description}
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const inputId = `${baseId}-${index}`;
          const errorId = `${inputId}-erro`;
          const itemError = errors[name]?.[index]?.value?.message;
          const position = index + 1;

          return (
            <li key={field.id} className="flex flex-col gap-1.5">
              <label htmlFor={inputId} className="text-xs text-text-muted">
                {label} {position}
              </label>
              <div className="flex items-start gap-2">
                <input
                  id={inputId}
                  type="text"
                  data-focus-key={`input-${index}`}
                  readOnly={readOnly}
                  aria-readonly={readOnly || undefined}
                  aria-invalid={itemError ? true : undefined}
                  aria-describedby={itemError ? errorId : undefined}
                  className={INPUT_CLASS}
                  {...register(`${name}.${index}.value` as const)}
                />
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    data-focus-key={`up-${index}`}
                    aria-label={`Mover ${itemLabel} ${position} para cima`}
                    disabled={readOnly || index === 0}
                    onClick={() => {
                      pendingFocus.current = { kind: "up", index: index - 1 };
                      move(index, index - 1);
                    }}
                    className={ICON_BUTTON_CLASS}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    data-focus-key={`down-${index}`}
                    aria-label={`Mover ${itemLabel} ${position} para baixo`}
                    disabled={readOnly || index === fields.length - 1}
                    onClick={() => {
                      pendingFocus.current = { kind: "down", index: index + 1 };
                      move(index, index + 1);
                    }}
                    className={ICON_BUTTON_CLASS}
                  >
                    Descer
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${itemLabel} ${position}`}
                    disabled={readOnly || fields.length <= min}
                    onClick={() => {
                      pendingFocus.current = {
                        kind: "input",
                        index: Math.min(index, fields.length - 2),
                      };
                      remove(index);
                    }}
                    className={ICON_BUTTON_CLASS}
                  >
                    Remover
                  </button>
                </div>
              </div>
              {itemError && (
                <p id={errorId} className="text-xs text-danger">
                  {itemError}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {listMessage && (
        <p id={listErrorId} className="text-sm text-danger">
          {listMessage}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          data-focus-key="add-0"
          disabled={readOnly || fields.length >= max}
          onClick={() => append({ value: "" }, { shouldFocus: true })}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {addLabel}
        </button>
        <span className="text-xs text-text-muted">
          {fields.length} de {max}
        </span>
      </div>
    </fieldset>
  );
}
