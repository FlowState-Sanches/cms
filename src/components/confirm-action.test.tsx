import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AdminActionResult } from "@/lib/admin-action";
import { ConfirmAction } from "./confirm-action";

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
    const action = vi.fn(() => new Promise<AdminActionResult>(() => {}));
    const user = userEvent.setup();
    renderConfirm(action);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    const confirm = within(dialog).getByRole("button", { name: "Confirmar bloqueio" });
    await user.dblClick(confirm);

    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(confirm).toBeDisabled());
  });

  it("Esc não fecha o diálogo enquanto a action está em andamento", async () => {
    // jsdom não simula o fechamento nativo do <dialog> ao teclar Esc (só o
    // navegador dispara "cancel" e fecha sozinho), então o teste dispara o
    // evento "cancel" diretamente e verifica se o handler cancela o default.
    const action = vi.fn(() => new Promise<AdminActionResult>(() => {}));
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
});
