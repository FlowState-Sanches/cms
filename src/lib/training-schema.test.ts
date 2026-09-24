import { describe, expect, it } from "vitest";
import type { CmsTraining } from "./api/schemas";
import {
  emptyTrainingForm,
  fromTraining,
  toTrainingInput,
  trainingFormSchema,
  trainingIdSchema,
  type TrainingFormValues,
} from "./training-schema";

const sampleTraining: CmsTraining = {
  id: "tecnico-t1",
  code: "T1",
  pillar: "tecnico",
  order: 1,
  title: "Leitura de jogo",
  subtitle: "Antecipar a jogada",
  levelLabel: "Iniciante",
  durationMinutes: 15,
  summary: "Aprenda a ler o jogo antes da bola chegar.",
  learnings: ["Olhar antes de receber", "Escanear o campo"],
  coach: { quote: "Quem vê antes decide melhor.", author: "Coach Ana" },
  unlockHint: "Conclua o treino anterior",
  selfAssessment: ["Você olhou antes de receber?"],
  reference: {
    title: "Artigo sobre percepção",
    provider: "FlowState",
    url: "https://flowstate.example/artigo",
  },
  status: "draft",
  version: 1,
  publishedAt: null,
  reviewComment: null,
  author: { id: "u1", name: "Prof. Rui" },
  hasCompletions: false,
  hasVideo: false,
  demoVideoUrl: null,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-02T10:00:00.000Z",
  events: [],
};

function validValues(): TrainingFormValues {
  return fromTraining(sampleTraining);
}

function firstMessage(values: unknown, path: string): string | undefined {
  const result = trainingFormSchema.safeParse(values);
  if (result.success) {
    return undefined;
  }
  return result.error.issues.find((issue) => issue.path.join(".") === path)
    ?.message;
}

describe("trainingFormSchema", () => {
  it("aceita valores válidos", () => {
    expect(trainingFormSchema.safeParse(validValues()).success).toBe(true);
  });

  it("rejeita 0 aprendizados com mensagem em português", () => {
    const values = { ...validValues(), learnings: [] };
    expect(firstMessage(values, "learnings")).toBe(
      "Inclua de 1 a 8 aprendizados.",
    );
  });

  it("rejeita 9 aprendizados com mensagem em português", () => {
    const learnings = Array.from({ length: 9 }, (_, index) => ({
      value: `Aprendizado ${index + 1}`,
    }));
    const values = { ...validValues(), learnings };
    expect(firstMessage(values, "learnings")).toBe(
      "Inclua de 1 a 8 aprendizados.",
    );
  });

  it("rejeita duração 0", () => {
    const values = { ...validValues(), durationMinutes: 0 };
    expect(firstMessage(values, "durationMinutes")).toBe(
      "Informe a duração em minutos, de 1 a 240.",
    );
  });

  it("rejeita duração vazia (NaN do input numérico)", () => {
    const values = { ...validValues(), durationMinutes: Number.NaN };
    expect(firstMessage(values, "durationMinutes")).toBe(
      "Informe a duração em minutos, de 1 a 240.",
    );
  });

  it("rejeita URL http na referência", () => {
    const values = {
      ...validValues(),
      reference: {
        enabled: true,
        title: "Artigo",
        provider: "Site",
        url: "http://exemplo.com",
      },
    };
    expect(firstMessage(values, "reference.url")).toBe("Use um link https.");
  });

  it("ignora os campos da referência quando ela está desativada", () => {
    const values = {
      ...validValues(),
      reference: { enabled: false, title: "", provider: "", url: "" },
    };
    expect(trainingFormSchema.safeParse(values).success).toBe(true);
  });

  it("normaliza o código com trim e caixa alta", () => {
    const values = { ...validValues(), code: " 3b " };
    const result = trainingFormSchema.safeParse(values);
    expect(result.success).toBe(true);
    expect(result.data?.code).toBe("3B");
  });

  it("rejeita código com caracteres fora do padrão", () => {
    const values = { ...validValues(), code: "T-1" };
    expect(firstMessage(values, "code")).toBe(
      "Use de 1 a 10 letras ou números, sem espaços.",
    );
  });

  it("formulário vazio não é válido", () => {
    expect(
      trainingFormSchema.safeParse(emptyTrainingForm("fisico")).success,
    ).toBe(false);
  });
});

describe("toTrainingInput / fromTraining", () => {
  it("gera reference null quando a referência está desativada", () => {
    const values: TrainingFormValues = {
      ...validValues(),
      reference: { enabled: false, title: "x", provider: "y", url: "z" },
    };
    expect(toTrainingInput(values).reference).toBeNull();
  });

  it("envia o código em caixa alta", () => {
    expect(toTrainingInput({ ...validValues(), code: " 3b " }).code).toBe("3B");
  });

  it("fromTraining seguido de toTrainingInput preserva o treino", () => {
    expect(toTrainingInput(fromTraining(sampleTraining))).toEqual({
      pillar: sampleTraining.pillar,
      code: sampleTraining.code,
      title: sampleTraining.title,
      subtitle: sampleTraining.subtitle,
      levelLabel: sampleTraining.levelLabel,
      durationMinutes: sampleTraining.durationMinutes,
      summary: sampleTraining.summary,
      learnings: sampleTraining.learnings,
      coach: sampleTraining.coach,
      unlockHint: sampleTraining.unlockHint,
      selfAssessment: sampleTraining.selfAssessment,
      reference: sampleTraining.reference,
    });
  });

  it("fromTraining com reference null desativa a referência", () => {
    const values = fromTraining({ ...sampleTraining, reference: null });
    expect(values.reference).toEqual({
      enabled: false,
      title: "",
      provider: "",
      url: "",
    });
  });

  it("emptyTrainingForm usa o pilar informado e um item em cada lista", () => {
    const values = emptyTrainingForm("psiquico");
    expect(values.pillar).toBe("psiquico");
    expect(values.learnings).toHaveLength(1);
    expect(values.selfAssessment).toHaveLength(1);
    expect(values.reference.enabled).toBe(false);
  });
});

describe("trainingIdSchema", () => {
  it("aceita slugs da API e rejeita caminhos", () => {
    expect(trainingIdSchema.safeParse("tecnico-t1-2").success).toBe(true);
    expect(trainingIdSchema.safeParse("../acesso").success).toBe(false);
    expect(trainingIdSchema.safeParse("").success).toBe(false);
  });
});
