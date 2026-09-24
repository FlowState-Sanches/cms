import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

describe("GlobalError", () => {
  it("mostra mensagem em PT-BR e chama retry ao clicar em Tentar de novo", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<GlobalError error={new Error("boom")} retry={retry} />);

    expect(
      screen.getByRole("heading", { name: "Algo deu errado." }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
