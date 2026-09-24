import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrainingHistory } from "./training-history";

describe("TrainingHistory", () => {
  it("lista ação, pessoa, data e comentário", () => {
    render(
      <TrainingHistory
        events={[
          {
            id: "e2",
            action: "returned",
            comment: "Ajuste o resumo.",
            actor: { id: "adm", name: "Curadora Bia" },
            createdAt: "2026-09-10T12:00:00.000Z",
          },
          {
            id: "e1",
            action: "created",
            comment: null,
            actor: null,
            createdAt: "2026-09-01T12:00:00.000Z",
          },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Devolvido");
    expect(items[0]).toHaveTextContent("Curadora Bia em 10/09/2026");
    expect(items[0]).toHaveTextContent("Ajuste o resumo.");
    expect(items[1]).toHaveTextContent("Criado");
    expect(items[1]).toHaveTextContent("Sistema em 01/09/2026");
  });

  it("mostra estado vazio", () => {
    render(<TrainingHistory events={[]} />);
    expect(screen.getByText("Nenhum evento registrado.")).toBeInTheDocument();
  });
});
