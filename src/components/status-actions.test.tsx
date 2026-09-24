import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsAccess, TrainingStatus } from "@/lib/api/schemas";

const actions = vi.hoisted(() => ({
  transitionAction: vi.fn(),
  giveBackAction: vi.fn(),
  deleteTrainingAction: vi.fn(),
}));
vi.mock("@/app/(cms)/treinos/actions", () => actions);

import { StatusActions } from "./status-actions";

const professor: CmsAccess = {
  canEdit: true,
  canCurate: false,
  user: { id: "prof", name: "Prof" },
};
const admin: CmsAccess = {
  canEdit: true,
  canCurate: true,
  user: { id: "adm", name: "Admin" },
};

function training(status: TrainingStatus, authorId = "prof") {
  return {
    id: "tecnico-t1",
    status,
    author: { id: authorId, name: "Autor" },
    publishedAt: null,
    hasCompletions: false,
  };
}

function buttonNames(): string[] {
  return screen
    .queryAllByRole("button")
    .filter((button) => !button.closest("dialog"))
    .map((button) => button.textContent ?? "");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StatusActions: botões por status e papel", () => {
  it.each<[string, CmsAccess, TrainingStatus, string, string[]]>([
    [
      "professor autor",
      professor,
      "draft",
      "prof",
      ["Enviar para revisão", "Excluir"],
    ],
    ["professor autor", professor, "review", "prof", []],
    ["professor autor", professor, "published", "prof", []],
    ["professor autor", professor, "archived", "prof", []],
    ["professor não autor", professor, "draft", "outro", []],
    ["professor não autor", professor, "published", "outro", []],
    [
      "admin",
      admin,
      "draft",
      "prof",
      ["Enviar para revisão", "Publicar", "Arquivar", "Excluir"],
    ],
    ["admin", admin, "review", "prof", ["Publicar", "Devolver", "Arquivar"]],
    ["admin", admin, "published", "prof", ["Despublicar", "Arquivar"]],
    ["admin", admin, "archived", "prof", []],
  ])("%s em %s", (_role, access, status, authorId, expected) => {
    render(
      <StatusActions training={training(status, authorId)} access={access} />,
    );
    expect(buttonNames()).toEqual(expected);
  });

  it("não mostra Excluir para rascunho que já foi publicado", () => {
    render(
      <StatusActions
        training={{ ...training("draft"), publishedAt: "2026-01-01T00:00:00Z" }}
        access={professor}
      />,
    );
    expect(buttonNames()).toEqual(["Enviar para revisão"]);
  });
});

describe("StatusActions: interações", () => {
  it("Enviar para revisão chama a transição", async () => {
    actions.transitionAction.mockResolvedValue({ ok: true, id: "tecnico-t1" });
    const user = userEvent.setup();
    render(<StatusActions training={training("draft")} access={professor} />);

    await user.click(
      screen.getByRole("button", { name: "Enviar para revisão" }),
    );

    await waitFor(() =>
      expect(actions.transitionAction).toHaveBeenCalledWith(
        "tecnico-t1",
        "submeter",
      ),
    );
  });

  it("mostra erro da action em role=alert", async () => {
    actions.transitionAction.mockResolvedValue({
      ok: false,
      error: "Essa ação não é permitida no status atual do treino.",
    });
    const user = userEvent.setup();
    render(<StatusActions training={training("review")} access={admin} />);

    await user.click(screen.getByRole("button", { name: "Publicar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Essa ação não é permitida no status atual do treino.",
    );
  });

  it("Devolver abre diálogo com comentário obrigatório", async () => {
    actions.giveBackAction.mockResolvedValue({ ok: true, id: "tecnico-t1" });
    const user = userEvent.setup();
    render(<StatusActions training={training("review")} access={admin} />);

    await user.click(screen.getByRole("button", { name: "Devolver" }));
    const dialog = screen.getByRole("dialog", {
      name: "Devolver para o autor",
    });
    expect(dialog).toHaveAttribute("open");
    const textarea = within(dialog).getByLabelText("Comentário para o autor");
    expect(textarea).toHaveFocus();

    await user.type(textarea, "ok");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar devolução" }),
    );
    expect(
      within(dialog).getByText("Escreva um comentário de 3 a 1000 caracteres."),
    ).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(actions.giveBackAction).not.toHaveBeenCalled();

    await user.type(textarea, " ajuste o resumo");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar devolução" }),
    );

    await waitFor(() =>
      expect(actions.giveBackAction).toHaveBeenCalledWith(
        "tecnico-t1",
        "ok ajuste o resumo",
      ),
    );
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
  });

  it("Arquivar pede confirmação antes de chamar a action", async () => {
    actions.transitionAction.mockResolvedValue({ ok: true, id: "tecnico-t1" });
    const user = userEvent.setup();
    render(<StatusActions training={training("published")} access={admin} />);

    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    const dialog = screen.getByRole("dialog", { name: "Arquivar treino" });
    expect(dialog).toHaveTextContent("sai do app");
    expect(actions.transitionAction).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(actions.transitionAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar arquivamento" }),
    );
    await waitFor(() =>
      expect(actions.transitionAction).toHaveBeenCalledWith(
        "tecnico-t1",
        "arquivar",
      ),
    );
  });

  it("Excluir pede confirmação e chama deleteTrainingAction", async () => {
    actions.deleteTrainingAction.mockResolvedValue({
      ok: false,
      error: "Use arquivar em vez de excluir.",
    });
    const user = userEvent.setup();
    render(<StatusActions training={training("draft")} access={professor} />);

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir treino" });
    expect(dialog).toHaveTextContent("não pode ser desfeita");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar exclusão" }),
    );

    await waitFor(() =>
      expect(actions.deleteTrainingAction).toHaveBeenCalledWith("tecnico-t1"),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Use arquivar em vez de excluir.",
    );
  });
});

describe("StatusActions: alterações não salvas", () => {
  it("desabilita todas as ações e liga o aviso via aria-describedby", () => {
    render(
      <StatusActions
        training={training("review")}
        access={admin}
        hasUnsavedChanges
      />,
    );
    const hint = screen.getByText(
      "Salve as alterações antes de mudar o status.",
    );
    for (const name of ["Publicar", "Devolver", "Arquivar"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-describedby", hint.id);
    }
  });
});
