import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ grantAdminAction: vi.fn(), revokeAdminAction: vi.fn() }));
vi.mock("@/app/(cms)/(admin)/admins/actions", () => actions);

import { GrantAdminForm } from "./grant-admin-form";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GrantAdminForm", () => {
  it("envia o e-mail e anuncia o sucesso em role=status", async () => {
    actions.grantAdminAction.mockResolvedValue({ ok: true, message: "Nova Pessoa agora é admin." });
    const user = userEvent.setup();
    render(<GrantAdminForm />);

    await user.type(screen.getByLabelText("E-mail da conta"), "nova@x.test");
    await user.click(screen.getByRole("button", { name: "Conceder acesso" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Nova Pessoa agora é admin.");
    const formData = actions.grantAdminAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("nova@x.test");
  });

  it("erro de campo marca o input e liga a mensagem por aria-describedby", async () => {
    actions.grantAdminAction.mockResolvedValue({
      ok: false,
      error: "Nenhuma conta encontrada com esse e-mail.",
      email: "ninguem@x.test",
      fieldError: "Nenhuma conta encontrada com esse e-mail.",
    });
    const user = userEvent.setup();
    render(<GrantAdminForm />);

    await user.type(screen.getByLabelText("E-mail da conta"), "ninguem@x.test");
    await user.click(screen.getByRole("button", { name: "Conceder acesso" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Nenhuma conta encontrada com esse e-mail.");
    const input = screen.getByLabelText("E-mail da conta");
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("erro geral aparece sem marcar o campo", async () => {
    actions.grantAdminAction.mockResolvedValue({
      ok: false,
      error: "Sua conta não tem permissão para esta ação.",
      email: "adm@x.test",
    });
    const user = userEvent.setup();
    render(<GrantAdminForm />);

    await user.type(screen.getByLabelText("E-mail da conta"), "adm@x.test");
    await user.click(screen.getByRole("button", { name: "Conceder acesso" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sua conta não tem permissão para esta ação.",
    );
    expect(screen.getByLabelText("E-mail da conta")).not.toHaveAttribute("aria-invalid");
  });
});
