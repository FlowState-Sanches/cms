"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

type LoginFormProps = {
  sessaoExpirada: boolean;
};

export function LoginForm({ sessaoExpirada }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      {sessaoExpirada && (
        <p
          role="alert"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted"
        >
          Sua sessão expirou. Entre de novo.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-text">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={state?.error ? true : undefined}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus-visible:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-text">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.error ? true : undefined}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus-visible:border-primary"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-primary px-4 py-2 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
