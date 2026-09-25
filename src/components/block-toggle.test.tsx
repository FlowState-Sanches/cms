import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ setBlockedAction: vi.fn(), setVerifiedAction: vi.fn() }));
vi.mock("@/app/(cms)/(admin)/actions", () => actions);

import { BlockToggle } from "./block-toggle";

const ID = "7f3c2a1e-4b5d-4c6e-8f90-1a2b3c4d5e6f";

beforeEach(() => {
  vi.clearAllMocks();
  actions.setBlockedAction.mockResolvedValue({ ok: true });
});

describe("BlockToggle", () => {
  it("conta ativa: Bloquear pede confirmação e chama a action com blocked=true", async () => {
    const user = userEvent.setup();
    render(<BlockToggle kind="aluno" userId={ID} name="Bruno" blocked={false} />);

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Bloquear conta" });
    expect(dialog).toHaveTextContent("Bruno perde o acesso na próxima requisição");
    expect(dialog).not.toHaveTextContent("catálogo");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar bloqueio" }));

    await waitFor(() =>
      expect(actions.setBlockedAction).toHaveBeenCalledWith("aluno", ID, true),
    );
  });

  it("professor: o aviso cita o catálogo e as aulas já confirmadas", async () => {
    const user = userEvent.setup();
    render(<BlockToggle kind="professor" userId={ID} name="Ana" blocked={false} />);
    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    expect(screen.getByRole("dialog", { name: "Bloquear conta" })).toHaveTextContent(
      "aulas já confirmadas não são canceladas",
    );
  });

  it("conta bloqueada: Desbloquear chama a action com blocked=false", async () => {
    const user = userEvent.setup();
    render(<BlockToggle kind="fotografo" userId={ID} name="Carla" blocked />);

    await user.click(screen.getByRole("button", { name: "Desbloquear" }));
    const dialog = screen.getByRole("dialog", { name: "Desbloquear conta" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar desbloqueio" }));

    await waitFor(() =>
      expect(actions.setBlockedAction).toHaveBeenCalledWith("fotografo", ID, false),
    );
  });
});
