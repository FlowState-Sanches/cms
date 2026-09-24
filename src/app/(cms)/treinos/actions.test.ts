import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cmsApi: {
    create: vi.fn(),
    update: vi.fn(),
    transition: vi.fn(),
    giveBack: vi.fn(),
    remove: vi.fn(),
    videoUploadUrl: vi.fn(),
    confirmVideo: vi.fn(),
    removeVideo: vi.fn(),
  },
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/api/client", () => ({ cmsApi: mocks.cmsApi }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { ApiError } from "@/lib/api/errors";
import type { TrainingFormValues } from "@/lib/training-schema";
import {
  confirmVideoAction,
  createTrainingAction,
  deleteTrainingAction,
  giveBackAction,
  requestVideoUploadAction,
  transitionAction,
  updateTrainingAction,
} from "./actions";

const values: TrainingFormValues = {
  pillar: "tecnico",
  code: " t9 ",
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTrainingAction", () => {
  it("valida no servidor e devolve fieldErrors sem chamar a API", async () => {
    const result = await createTrainingAction({ ...values, title: "x" });
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { title: "Use de 3 a 80 caracteres." },
    });
    expect(mocks.cmsApi.create).not.toHaveBeenCalled();
  });

  it("cria, revalida e redireciona para o detalhe", async () => {
    mocks.cmsApi.create.mockResolvedValue({ id: "tecnico-t9" });
    await expect(createTrainingAction(values)).rejects.toThrow(
      "NEXT_REDIRECT:/treinos/tecnico-t9",
    );
    expect(mocks.cmsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pillar: "tecnico",
        code: "T9",
        reference: null,
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/treinos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/treinos/tecnico-t9");
  });

  it("CODE_TAKEN vira erro geral e erro no campo código", async () => {
    mocks.cmsApi.create.mockRejectedValue(
      new ApiError(409, "conflict", "CODE_TAKEN"),
    );
    const result = await createTrainingAction(values);
    expect(result).toEqual({
      ok: false,
      error: "Já existe um treino com esse código.",
      fieldErrors: { code: "Já existe um treino com esse código." },
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("400 do ValidationPipe vira mensagem geral, sem fieldErrors", async () => {
    mocks.cmsApi.create.mockRejectedValue(
      new ApiError(400, "title must be longer", null),
    );
    const result = await createTrainingAction(values);
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("fieldErrors");
  });

  it("relança erros que não são ApiError (ex.: redirect de sessão expirada)", async () => {
    mocks.cmsApi.create.mockRejectedValue(
      new Error("NEXT_REDIRECT:/sessao-expirada"),
    );
    await expect(createTrainingAction(values)).rejects.toThrow(
      "NEXT_REDIRECT:/sessao-expirada",
    );
  });
});

describe("updateTrainingAction", () => {
  it("envia o PATCH sem o pilar", async () => {
    mocks.cmsApi.update.mockResolvedValue({ id: "tecnico-t9" });
    const result = await updateTrainingAction("tecnico-t9", values);
    expect(result).toEqual({ ok: true, id: "tecnico-t9" });
    const input = mocks.cmsApi.update.mock.calls[0]?.[1];
    expect(input).not.toHaveProperty("pillar");
    expect(input.code).toBe("T9");
  });

  it("rejeita id fora do padrão de slug", async () => {
    const result = await updateTrainingAction("../acesso", values);
    expect(result.ok).toBe(false);
    expect(mocks.cmsApi.update).not.toHaveBeenCalled();
  });

  it("mapeia SELF_ASSESSMENT_LOCKED", async () => {
    mocks.cmsApi.update.mockRejectedValue(
      new ApiError(409, "x", "SELF_ASSESSMENT_LOCKED"),
    );
    const result = await updateTrainingAction("tecnico-t9", values);
    expect(result).toEqual({
      ok: false,
      error:
        "Não é possível alterar a autoavaliação: já há alunos com essa etapa concluída.",
    });
  });
});

describe("transições", () => {
  it("transitionAction chama a API e revalida", async () => {
    mocks.cmsApi.transition.mockResolvedValue({});
    expect(await transitionAction("tecnico-t9", "publicar")).toEqual({
      ok: true,
      id: "tecnico-t9",
    });
    expect(mocks.cmsApi.transition).toHaveBeenCalledWith(
      "tecnico-t9",
      "publicar",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/treinos/tecnico-t9");
  });

  it("transitionAction aceita desarquivar", async () => {
    mocks.cmsApi.transition.mockResolvedValue({});
    expect(await transitionAction("tecnico-t9", "desarquivar")).toEqual({
      ok: true,
      id: "tecnico-t9",
    });
    expect(mocks.cmsApi.transition).toHaveBeenCalledWith(
      "tecnico-t9",
      "desarquivar",
    );
  });

  it("transitionAction rejeita ação desconhecida", async () => {
    const result = await transitionAction("tecnico-t9", "apagar" as never);
    expect(result.ok).toBe(false);
    expect(mocks.cmsApi.transition).not.toHaveBeenCalled();
  });

  it("giveBackAction exige comentário de 3 a 1000", async () => {
    const result = await giveBackAction("tecnico-t9", " a ");
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { comment: expect.any(String) },
    });
    expect(mocks.cmsApi.giveBack).not.toHaveBeenCalled();
  });

  it("giveBackAction envia o comentário aparado", async () => {
    mocks.cmsApi.giveBack.mockResolvedValue({});
    await giveBackAction("tecnico-t9", "  Ajuste o resumo  ");
    expect(mocks.cmsApi.giveBack).toHaveBeenCalledWith(
      "tecnico-t9",
      "Ajuste o resumo",
    );
  });

  it("deleteTrainingAction redireciona para a lista", async () => {
    mocks.cmsApi.remove.mockResolvedValue(undefined);
    await expect(deleteTrainingAction("tecnico-t9")).rejects.toThrow(
      "NEXT_REDIRECT:/treinos",
    );
  });

  it("deleteTrainingAction devolve USE_ARCHIVE sem redirecionar", async () => {
    mocks.cmsApi.remove.mockRejectedValue(
      new ApiError(409, "x", "USE_ARCHIVE"),
    );
    expect(await deleteTrainingAction("tecnico-t9")).toEqual({
      ok: false,
      error: "Use arquivar em vez de excluir.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("vídeo", () => {
  it("INVALID_VIDEO com mensagem da API mostra a mensagem da API, não a genérica", async () => {
    mocks.cmsApi.videoUploadUrl.mockRejectedValue(
      new ApiError(
        400,
        "O vídeo excede o limite de 500 MB configurado neste ambiente.",
        "INVALID_VIDEO",
      ),
    );
    const result = await requestVideoUploadAction(
      "tecnico-t9",
      "video/mp4",
      1024,
    );
    expect(result).toEqual({
      ok: false,
      error: "O vídeo excede o limite de 500 MB configurado neste ambiente.",
    });
  });

  it("INVALID_VIDEO sem mensagem cai na mensagem genérica", async () => {
    mocks.cmsApi.confirmVideo.mockRejectedValue(
      new ApiError(400, "", "INVALID_VIDEO"),
    );
    const result = await confirmVideoAction("tecnico-t9", "chave");
    expect(result).toEqual({
      ok: false,
      error: "Vídeo inválido. Confira o formato e o tamanho do arquivo.",
    });
  });
});
