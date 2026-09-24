import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it.each([
    ["draft", "Rascunho"],
    ["review", "Em revisão"],
    ["published", "Publicado"],
    ["archived", "Arquivado"],
  ] as const)("mostra o rótulo em PT-BR para status %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("expõe o rótulo como texto visível, não só por cor", () => {
    render(<StatusBadge status="published" />);
    const badge = screen.getByText("Publicado");
    expect(badge.textContent).toBe("Publicado");
  });
});
