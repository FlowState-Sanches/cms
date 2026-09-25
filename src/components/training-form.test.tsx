import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(cms)/treinos/actions", () => ({}));

import {
  emptyTrainingForm,
  type TrainingFormValues,
} from "@/lib/training-schema";
import { TrainingForm, type PillarOption } from "./training-form";

const pillarOptions: PillarOption[] = [
  { key: "tecnico", label: "Técnico" },
  { key: "fisico", label: "Físico" },
  { key: "psiquico", label: "Psíquico" },
  { key: "flow", label: "Flow" },
];

const filled: TrainingFormValues = {
  pillar: "tecnico",
  code: "T9",
  title: "Leitura de jogo",
  subtitle: "Antecipar a jogada",
  levelLabel: "Iniciante",
  durationMinutes: 15,
  summary: "Aprenda a ler o jogo antes da bola chegar.",
  learnings: [{ value: "Olhar antes de receber" }],
  coach: { quote: "Quem vê antes decide melhor.", author: "Coach Ana" },
  unlockHint: "Conclua o treino anterior",
  selfAssessment: [{ value: "Você olhou antes de receber?" }],
  reference: { enabled: false, title: "", provider: "", url: "" },
};

describe("TrainingForm", () => {
  it("submeter vazio mostra erros, foca o primeiro e não chama onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <TrainingForm
        mode="create"
        defaultValues={emptyTrainingForm("tecnico")}
        pillarOptions={pillarOptions}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    const code = screen.getByLabelText("Código");
    await waitFor(() => expect(code).toHaveAttribute("aria-invalid", "true"));
    expect(code).toHaveFocus();
    expect(code.getAttribute("aria-describedby")).toContain("treino-code-erro");
    expect(
      screen.getByText("Use de 1 a 10 letras ou números, sem espaços."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Informe a duração em minutos, de 1 a 240."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preencher e submeter chama onSubmit com os valores do formulário", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const empty = emptyTrainingForm("fisico");
    render(
      <TrainingForm
        mode="create"
        defaultValues={empty}
        pillarOptions={pillarOptions}
        onSubmit={onSubmit}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Pilar"), "tecnico");
    await user.type(screen.getByLabelText("Código"), "t9");
    await user.type(screen.getByLabelText("Nível"), filled.levelLabel);
    await user.type(screen.getByLabelText("Título"), filled.title);
    await user.type(screen.getByLabelText("Subtítulo"), filled.subtitle);
    await user.type(screen.getByLabelText("Duração (minutos)"), "15");
    await user.type(screen.getByLabelText("Resumo"), filled.summary);
    await user.type(
      screen.getByLabelText("Aprendizado 1"),
      "Olhar antes de receber",
    );
    await user.type(
      screen.getByLabelText("Frase do coach"),
      filled.coach.quote,
    );
    await user.type(
      screen.getByLabelText("Autor da frase"),
      filled.coach.author,
    );
    await user.type(
      screen.getByLabelText("Dica de desbloqueio"),
      filled.unlockHint,
    );
    await user.type(
      screen.getByLabelText("Pergunta 1"),
      "Você olhou antes de receber?",
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(filled);
  });

  it("valida a referência só quando o checkbox está marcado", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText("Link")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Incluir referência externa"));
    await user.type(screen.getByLabelText("Título da referência"), "Artigo");
    await user.type(screen.getByLabelText("Fonte"), "Site");
    await user.type(screen.getByLabelText("Link"), "http://exemplo.com");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Use um link https.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("na edição o pilar é só leitura", () => {
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Pilar")).not.toBeInTheDocument();
    expect(
      screen.getByText("Técnico (não pode ser alterado)"),
    ).toBeInTheDocument();
  });

  it("hasCompletions trava a autoavaliação e mostra o aviso", () => {
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
        hasCompletions
      />,
    );

    expect(
      screen.getByText(
        "Alunos já responderam esta autoavaliação. As perguntas não podem ser alteradas.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pergunta 1")).toHaveAttribute("readonly");
    expect(
      screen.getByRole("button", { name: "Adicionar pergunta" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Aprendizado 1")).not.toHaveAttribute(
      "readonly",
    );
  });

  it("aplica erros de campo e mensagem geral vindos do servidor", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: "Já existe um treino com esse código.",
      fieldErrors: { code: "Já existe um treino com esse código." },
    });
    const user = userEvent.setup();
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um treino com esse código.",
    );
    const code = screen.getByLabelText("Código");
    expect(code).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(code).toHaveFocus());
  });

  it("confirma o salvamento na edição", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true, id: "tecnico-t9" });
    const user = userEvent.setup();
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Alterações salvas.",
    );
  });

  it("mostra aviso de treino publicado perto do botão de salvar", () => {
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
        status="published"
      />,
    );

    expect(
      screen.getByText(
        "Este treino está publicado. As alterações aparecem no app assim que você salvar.",
      ),
    ).toBeInTheDocument();
  });

  it("não mostra o aviso de publicado quando o treino é rascunho", () => {
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
        status="draft"
      />,
    );

    expect(
      screen.queryByText(
        "Este treino está publicado. As alterações aparecem no app assim que você salvar.",
      ),
    ).not.toBeInTheDocument();
  });

  it("readOnly mostra os valores sem campos editáveis", () => {
    render(
      <TrainingForm
        mode="edit"
        defaultValues={filled}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
        readOnly
      />,
    );

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(filled.title)).toBeInTheDocument();
    expect(screen.getByText("Sem referência externa.")).toBeInTheDocument();
  });

  it("no celular o botão de salvar ocupa a largura toda com alvo de 44 px", () => {
    render(
      <TrainingForm
        mode="create"
        defaultValues={emptyTrainingForm("tecnico")}
        pillarOptions={pillarOptions}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Salvar rascunho" })).toHaveClass(
      "w-full",
      "md:w-auto",
      "min-h-11",
      "lg:min-h-0",
    );
  });
});
