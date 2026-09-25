import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ setBlockedAction: vi.fn(), setVerifiedAction: vi.fn() }));
vi.mock("@/app/(cms)/(admin)/actions", () => actions);

import { VerifyToggle } from "./verify-toggle";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VerifyToggle", () => {
  it("pendente: Verificar professor chama a action direto, sem diálogo", async () => {
    actions.setVerifiedAction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<VerifyToggle professorId={ID} name="Ana" verified={false} />);

    await user.click(screen.getByRole("button", { name: "Verificar professor" }));
    await waitFor(() => expect(actions.setVerifiedAction).toHaveBeenCalledWith(ID, true));
  });

  it("pendente: erro aparece em role=alert", async () => {
    actions.setVerifiedAction.mockResolvedValue({
      ok: false,
      error: "Esta conta não tem o papel de professor.",
    });
    const user = userEvent.setup();
    render(<VerifyToggle professorId={ID} name="Ana" verified={false} />);

    await user.click(screen.getByRole("button", { name: "Verificar professor" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Esta conta não tem o papel de professor.",
    );
  });

  it("verificado: Remover verificação pede confirmação", async () => {
    actions.setVerifiedAction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<VerifyToggle professorId={ID} name="Ana" verified />);

    await user.click(screen.getByRole("button", { name: "Remover verificação" }));
    const dialog = screen.getByRole("dialog", { name: "Remover verificação" });
    expect(dialog).toHaveTextContent("Ana sai do catálogo do app");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar remoção" }));

    await waitFor(() => expect(actions.setVerifiedAction).toHaveBeenCalledWith(ID, false));
  });
});
