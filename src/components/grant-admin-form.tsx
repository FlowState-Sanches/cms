"use client";

import { useActionState, useId } from "react";
import { grantAdminAction } from "@/app/(cms)/(admin)/admins/actions";

/**
 * "Conceder por e-mail" (G3). `noValidate`: a validação é a do servidor,
 * para a mensagem ser a mesma com ou sem JS. Erro de campo fica ligado ao
 * input por `aria-describedby`; sucesso é anunciado em `role="status"`.
 */
export function GrantAdminForm() {
  const [state, formAction, pending] = useActionState(grantAdminAction, null);
  const inputId = useId();
  const hintId = `${inputId}-dica`;
  const errorId = `${inputId}-erro`;
  const fieldError = state && !state.ok ? state.fieldError : undefined;
  const generalError = state && !state.ok && !state.fieldError ? state.error : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3 md:max-w-md">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          E-mail da conta
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="off"
          required
          defaultValue={state && !state.ok ? state.email : ""}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
          className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus-visible:border-primary aria-invalid:border-danger lg:min-h-0"
        />
        <p id={hintId} className="text-xs text-text-muted">
          A pessoa precisa já ter conta no FlowState. O acesso vale a partir da próxima
          requisição dela.
        </p>
        {fieldError && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {fieldError}
          </p>
        )}
      </div>

      {generalError && (
        <p role="alert" className="text-sm text-danger">
          {generalError}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-primary">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="min-h-11 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-60 md:w-auto md:self-start lg:min-h-0"
      >
        Conceder acesso
      </button>
    </form>
  );
}
