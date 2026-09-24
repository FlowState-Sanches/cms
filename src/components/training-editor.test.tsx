import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsAccess } from "@/lib/api/schemas";
import type { TrainingFormValues } from "@/lib/training-schema";

const actions = vi.hoisted(() => ({
  createTrainingAction: vi.fn(),
  updateTrainingAction: vi.fn(),
  transitionAction: vi.fn(),
  giveBackAction: vi.fn(),
  deleteTrainingAction: vi.fn(),
  requestVideoUploadAction: vi.fn(),
  confirmVideoAction: vi.fn(),
  removeVideoAction: vi.fn(),
}));
vi.mock("@/app/(cms)/treinos/actions", () => actions);

// TrainingEditor (B5) inclui o VideoUploader, que usa `useRouter` para
// atualizar a página depois de enviar/remover o vídeo.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { TrainingEditor } from "./training-editor";

const admin: CmsAccess = {
  canEdit: true,
  canCurate: true,
  user: { id: "adm", name: "Admin" },
};

const values: TrainingFormValues = {
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

const HINT = "Salve as alterações antes de mudar o status.";

function renderEditor() {
  return render(
    <TrainingEditor
      mode="edit"
      trainingId="tecnico-t9"
      defaultValues={values}
      pillarOptions={[{ key: "tecnico", label: "Técnico" }]}
      readOnly={false}
      hasCompletions={false}
      statusActions={{
        training: {
          id: "tecnico-t9",
          status: "draft",
          author: { id: "prof", name: "Prof" },
          publishedAt: null,
          hasCompletions: false,
        },
        access: admin,
      }}
      demoVideoUrl={null}
      hasVideo={false}
    />,
  );
}

const STATUS_BUTTONS = [
  "Enviar para revisão",
  "Publicar",
  "Arquivar",
  "Excluir",
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TrainingEditor: alterações não salvas", () => {
  it("editar um campo desabilita as ações de status e mostra o aviso; salvar reabilita", async () => {
    actions.updateTrainingAction.mockResolvedValue({
      ok: true,
      id: "tecnico-t9",
    });
    const user = userEvent.setup();
    renderEditor();

    for (const name of STATUS_BUTTONS) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Título"), " avançada");

    const hint = await screen.findByText(HINT);
    for (const name of STATUS_BUTTONS) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-describedby", hint.id);
    }

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(actions.updateTrainingAction).toHaveBeenCalledWith(
        "tecnico-t9",
        expect.objectContaining({ title: "Leitura de jogo avançada" }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText(HINT)).not.toBeInTheDocument(),
    );
    for (const name of STATUS_BUTTONS) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("salvar com erro mantém as ações bloqueadas", async () => {
    actions.updateTrainingAction.mockResolvedValue({
      ok: false,
      error: "Não foi possível concluir. Tente de novo.",
    });
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText("Título"), " avançada");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("registra o aviso de saída (beforeunload) só enquanto há alterações", async () => {
    const user = userEvent.setup();
    renderEditor();

    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);

    await user.type(screen.getByLabelText("Título"), "x");
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});

describe("TrainingEditor: prévia mobile ao vivo (B5)", () => {
  it("atualiza a prévia enquanto o formulário é editado", async () => {
    const user = userEvent.setup();
    renderEditor();

    const preview = screen.getByRole("region", {
      name: "Pré-visualização no app",
    });
    expect(within(preview).getByText("Leitura de jogo")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Título"), " avançada");

    expect(
      within(preview).getByText("Leitura de jogo avançada"),
    ).toBeInTheDocument();
  });
});
