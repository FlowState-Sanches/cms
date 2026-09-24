import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CmsError from "./error";

describe("CmsError", () => {
  it("mostra mensagem em PT-BR e chama retry ao clicar em Tentar de novo", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<CmsError error={new Error("boom")} retry={retry} />);

    expect(
      screen.getByRole("heading", { name: "Não foi possível carregar esta página." }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
