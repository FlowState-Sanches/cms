import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsTrainingListItem } from "@/lib/api/schemas";
import { ReorderList } from "./reorder-list";

function item(
  id: string,
  order: number,
  title: string,
  status: CmsTrainingListItem["status"] = "published",
): CmsTrainingListItem {
  return {
    id,
    code: id.toUpperCase(),
    pillar: "tecnico",
    order,
    title,
    levelLabel: "Iniciante",
    status,
    author: null,
    hasVideo: false,
    updatedAt: "2026-01-01T00:00:00Z",
    publishedAt: null,
  };
}

const items: CmsTrainingListItem[] = [
  item("tecnico-t1", 1, "Primeiro treino"),
  item("tecnico-t2", 2, "Segundo treino"),
  item("tecnico-t3", 3, "Terceiro treino"),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReorderList: renderização", () => {
  it("renderiza a lista ordenada como <ol>", () => {
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Primeiro treino"),
      expect.stringContaining("Segundo treino"),
      expect.stringContaining("Terceiro treino"),
    ]);
  });

  it("não mostra itens arquivados", () => {
    render(
      <ReorderList
        pillar="tecnico"
        items={[...items, item("tecnico-t4", 4, "Arquivado", "archived")]}
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByText("Arquivado")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("primeiro item não tem botão 'para cima' e último não tem 'para baixo'", () => {
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: "Mover Primeiro treino para cima" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mover Terceiro treino para cima" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mover Terceiro treino para baixo" }),
    ).not.toBeInTheDocument();
  });
});

describe("ReorderList: reordenação", () => {
  it("botão 'para baixo' move o item e anuncia a nova posição", async () => {
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Segundo treino"),
      expect.stringContaining("Primeiro treino"),
      expect.stringContaining("Terceiro treino"),
    ]);
    expect(screen.getByText("Primeiro treino agora na posição 2 de 3")).toBeInTheDocument();
  });

  it("Alt+ArrowDown com o item focado move para baixo", async () => {
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );

    const rows = screen.getAllByRole("listitem");
    rows[0]?.focus();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    const reordered = screen.getAllByRole("listitem");
    expect(reordered.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Segundo treino"),
      expect.stringContaining("Primeiro treino"),
      expect.stringContaining("Terceiro treino"),
    ]);
  });

  it("Alt+ArrowUp com o item focado move para cima", async () => {
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );

    const rows = screen.getAllByRole("listitem");
    rows[2]?.focus();
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    const reordered = screen.getAllByRole("listitem");
    expect(reordered.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Primeiro treino"),
      expect.stringContaining("Terceiro treino"),
      expect.stringContaining("Segundo treino"),
    ]);
  });
});

describe("ReorderList: salvar e desfazer", () => {
  it("'Salvar ordem' e 'Desfazer' começam desabilitados e habilitam após mudar", async () => {
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    );

    expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeEnabled();
  });

  it("'Desfazer' volta à ordem original", async () => {
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    );
    await user.click(screen.getByRole("button", { name: "Desfazer" }));

    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Primeiro treino"),
      expect.stringContaining("Segundo treino"),
      expect.stringContaining("Terceiro treino"),
    ]);
    expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeDisabled();
  });

  it("'Salvar ordem' chama onSave com os ids na nova ordem e mostra confirmação", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={onSave} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    );
    await user.click(screen.getByRole("button", { name: "Salvar ordem" }));

    expect(onSave).toHaveBeenCalledWith([
      "tecnico-t2",
      "tecnico-t1",
      "tecnico-t3",
    ]);
    expect(await screen.findByRole("status")).toHaveTextContent("Ordem salva.");
    expect(screen.getByRole("button", { name: "Salvar ordem" })).toBeDisabled();
  });

  it("mostra o erro de onSave em role=alert", async () => {
    const onSave = vi.fn().mockResolvedValue({
      ok: false,
      error: "A nova ordem é inválida. Recarregue a lista e tente de novo.",
    });
    const user = userEvent.setup();
    render(
      <ReorderList pillar="tecnico" items={items} onSave={onSave} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Mover Primeiro treino para baixo" }),
    );
    await user.click(screen.getByRole("button", { name: "Salvar ordem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A nova ordem é inválida. Recarregue a lista e tente de novo.",
    );
  });
});
