import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RootError from "./error";

describe("RootError", () => {
  it("mostra mensagem em PT-BR e chama retry ao clicar em Tentar de novo", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<RootError error={new Error("boom")} retry={retry} />);

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar o CMS.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A API pode estar fora do ar ou ter respondido de forma inesperada.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
