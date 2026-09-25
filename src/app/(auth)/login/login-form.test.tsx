import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { loginActionMock } = vi.hoisted(() => ({ loginActionMock: vi.fn() }));
vi.mock("./actions", () => ({
  loginAction: loginActionMock,
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("renderiza os campos com labels associados", () => {
    render(<LoginForm sessaoExpirada={false} />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("mostra o aviso de sessão expirada quando solicitado", () => {
    render(<LoginForm sessaoExpirada />);

    expect(screen.getByText("Sua sessão expirou. Entre de novo.")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro devolvida pela action", async () => {
    loginActionMock.mockResolvedValue({ error: "E-mail ou senha incorretos." });
    const user = userEvent.setup();

    render(<LoginForm sessaoExpirada={false} />);

    await user.type(screen.getByLabelText("E-mail"), "prof@flowstate.com");
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    });
  });

  it("campos e botão têm alvo de 44 px abaixo de 1024 px", () => {
    render(<LoginForm sessaoExpirada={false} />);
    expect(screen.getByLabelText("E-mail")).toHaveClass("min-h-11", "lg:min-h-0");
    expect(screen.getByLabelText("Senha")).toHaveClass("min-h-11", "lg:min-h-0");
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveClass("min-h-11", "lg:min-h-0");
  });
});
