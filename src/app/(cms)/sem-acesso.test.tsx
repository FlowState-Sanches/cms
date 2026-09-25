import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SemAcesso } from "./sem-acesso";

describe("SemAcesso", () => {
  it("sem action mostra o botão Sair", () => {
    render(<SemAcesso message="Sem permissão." />);
    expect(screen.getByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("com action troca o Sair pela ação dada", () => {
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- action é um ReactNode arbitrário no teste, não precisa ser Link.
    render(<SemAcesso message="Sem permissão." action={<a href="/treinos">Ir para Treinos</a>} />);
    expect(screen.getByRole("link", { name: "Ir para Treinos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });
});
