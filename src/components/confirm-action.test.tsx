import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AdminActionResult } from "@/lib/admin-action";
import { ConfirmAction } from "./confirm-action";

/** Promise controlável de fora: evita deixar uma promise nunca resolvida
 * pendurada entre testes (React 19 entrelaça transições assíncronas
 * pendentes, o que vaza para o próximo teste do arquivo). */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

class TestErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <p role="alert">Falha inesperada: {this.state.error.message}</p>;
    }
    return this.props.children;
  }
}

function renderConfirm(action: () => Promise<AdminActionResult>) {
  render(
    <ConfirmAction
      triggerLabel="Bloquear"
      title="Bloquear conta"
      description="A pessoa perde o acesso na próxima requisição."
      confirmLabel="Confirmar bloqueio"
      action={action}
    />,
  );
}

describe("ConfirmAction", () => {
  it("abre o diálogo com foco em Cancelar e não chama a action", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription("A pessoa perde o acesso na próxima requisição.");
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });

  it("Cancelar fecha sem chamar a action", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(action).not.toHaveBeenCalled();
  });

  it("confirmar com sucesso fecha o diálogo", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar bloqueio" }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("erro da action aparece em role=alert e o diálogo continua aberto", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: "Admins não podem ser bloqueados. Revogue o acesso de admin antes.",
    });
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar bloqueio" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Admins não podem ser bloqueados. Revogue o acesso de admin antes.",
    );
    expect(dialog).toHaveAttribute("open");
  });

  it("clique duplo em Confirmar chama a action uma vez só e desabilita o botão", async () => {
    const { promise, resolve } = deferred<AdminActionResult>();
    const action = vi.fn(() => promise);
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    const confirm = within(dialog).getByRole("button", { name: "Confirmar bloqueio" });
    await user.dblClick(confirm);

    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(confirm).toBeDisabled());

    // Assenta a promise para não deixar uma transição pendente vazando para
    // o próximo teste (React 19 entrelaça transições assíncronas em aberto).
    await act(async () => resolve({ ok: true }));
  });

  it("Esc não fecha o diálogo enquanto a action está em andamento", async () => {
    // jsdom não simula o fechamento nativo do <dialog> ao teclar Esc (só o
    // navegador dispara "cancel" e fecha sozinho), então o teste dispara o
    // evento "cancel" diretamente e verifica se o handler cancela o default.
    const { promise, resolve } = deferred<AdminActionResult>();
    const action = vi.fn(() => promise);
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    const confirm = within(dialog).getByRole("button", { name: "Confirmar bloqueio" });
    await user.click(confirm);
    await waitFor(() => expect(confirm).toBeDisabled());

    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");

    await act(async () => resolve({ ok: true }));
  });

  it("Esc fecha o diálogo normalmente quando não há action em andamento", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });

    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(false);
  });

  it("no celular cabe na tela com os botões empilhados e a ação principal por último", async () => {
    const user = userEvent.setup();
    renderConfirm(vi.fn());

    const trigger = screen.getByRole("button", { name: "Bloquear" });
    expect(trigger).toHaveClass("min-h-11", "w-full", "md:w-auto", "lg:min-h-0");
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    expect(dialog).toHaveClass("w-[calc(100%-2rem)]", "max-w-md", "md:w-full");

    const buttons = within(dialog).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Cancelar",
      "Confirmar bloqueio",
    ]);
    expect(buttons[0]?.parentElement).toHaveClass("flex-col", "md:flex-row", "md:justify-end");
    for (const button of buttons) {
      expect(button).toHaveClass("min-h-11", "w-full", "md:w-auto");
    }
  });

  it("mensagem de erro longa quebra e o diálogo rola por dentro (Review Focus 5)", async () => {
    const longError = `${"Erro ".repeat(70)}${"x".repeat(60)}`;
    const action = vi.fn().mockResolvedValue({ ok: false, error: longError });
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]", "overflow-y-auto");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar bloqueio" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveClass("wrap-anywhere");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeEnabled(),
    );
  });

  it("erro que não é ApiError (rejeição inesperada) chega ao error boundary e não trava o diálogo em pending", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Falha de rede inesperada"));
    const user = userEvent.setup();
    render(
      <TestErrorBoundary>
        <ConfirmAction
          triggerLabel="Bloquear"
          title="Bloquear conta"
          description="A pessoa perde o acesso na próxima requisição."
          confirmLabel="Confirmar bloqueio"
          action={action}
        />
      </TestErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    await user.click(screen.getByRole("button", { name: "Confirmar bloqueio" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha inesperada: Falha de rede inesperada",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
