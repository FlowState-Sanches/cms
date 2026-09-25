import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("formata o número em pt-BR e mostra o detalhe", () => {
    render(<StatCard label="Alunos" value={12345} detail="30 pagos" />);
    expect(screen.getByText("12.345")).toBeInTheDocument();
    expect(screen.getByText("30 pagos")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("com href vira link com o rótulo no nome acessível", () => {
    render(<StatCard label="Professores" value={14} href="/professores" />);
    expect(screen.getByRole("link", { name: /Professores/ })).toHaveAttribute(
      "href",
      "/professores",
    );
  });
});
