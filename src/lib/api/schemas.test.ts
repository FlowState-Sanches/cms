import { describe, expect, it } from "vitest";
import { cmsTrainingSchema } from "./schemas";

const baseTraining = {
  id: "tecnico-t9",
  code: "T9",
  pillar: "tecnico",
  order: 1,
  title: "Leitura de jogo",
  subtitle: "Antecipar a jogada",
  levelLabel: "Iniciante",
  durationMinutes: 15,
  summary: "Aprenda a ler o jogo antes da bola chegar.",
  learnings: ["Olhar antes de receber"],
  coach: { quote: "Quem vê antes decide melhor.", author: "Coach Ana" },
  unlockHint: "Conclua o treino anterior",
  selfAssessment: ["Você olhou antes de receber?"],
  status: "published",
  version: 1,
  publishedAt: null,
  reviewComment: null,
  author: null,
  hasCompletions: false,
  hasVideo: false,
  demoVideoUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  events: [],
};

describe("cmsTrainingSchema (resposta da API)", () => {
  it("aceita reference com url http:// e título mais longo que o limite do formulário", () => {
    const longTitle = "T".repeat(200);
    const result = cmsTrainingSchema.safeParse({
      ...baseTraining,
      reference: {
        title: longTitle,
        provider: "Fonte externa",
        url: "http://exemplo.com/rota-antiga",
      },
    });
    expect(result.success).toBe(true);
    expect(result.data?.reference).toEqual({
      title: longTitle,
      provider: "Fonte externa",
      url: "http://exemplo.com/rota-antiga",
    });
  });

  it("aceita evento de desarquivamento no histórico", () => {
    const result = cmsTrainingSchema.safeParse({
      ...baseTraining,
      status: "draft",
      reference: null,
      events: [
        {
          id: "e1",
          action: "unarchived",
          comment: null,
          actor: { id: "adm", name: "Admin" },
          createdAt: "2026-09-24T00:00:00.000Z",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("aceita reference nula", () => {
    const result = cmsTrainingSchema.safeParse({
      ...baseTraining,
      reference: null,
    });
    expect(result.success).toBe(true);
  });
});
