import { describe, expect, it } from "vitest";
import {
  ACTION_LABELS,
  PILLAR_ORDER,
  STATUS_LABELS,
  formatDate,
  formatTimestamp,
} from "./labels";

describe("labels", () => {
  it("traduz todos os status de treino", () => {
    expect(STATUS_LABELS).toEqual({
      draft: "Rascunho",
      review: "Em revisão",
      published: "Publicado",
      archived: "Arquivado",
    });
  });

  it("traduz todas as ações do histórico", () => {
    expect(Object.keys(ACTION_LABELS).sort()).toEqual(
      [
        "created",
        "updated",
        "submitted",
        "returned",
        "published",
        "unpublished",
        "archived",
        "unarchived",
        "reordered",
        "video_attached",
        "video_removed",
      ].sort(),
    );
  });

  it("mantém a ordem fixa dos pilares", () => {
    expect(PILLAR_ORDER).toEqual(["tecnico", "fisico", "psiquico", "flow"]);
  });

  it("formata data ISO no padrão pt-BR", () => {
    expect(formatDate("2026-09-01T12:00:00.000Z")).toBe("01/09/2026");
  });

  it("formata timestamp ISO no fuso de São Paulo (H6)", () => {
    // 2026-09-01T23:30:00Z é 2026-09-01 20:30 em São Paulo (UTC-3): mesmo dia.
    expect(formatTimestamp("2026-09-01T23:30:00.000Z")).toBe("01/09/2026 20:30");
    // 2026-09-02T01:30:00Z (madrugada UTC) ainda é 2026-09-01 22:30 em São Paulo:
    // formatDate (UTC) mostraria o dia seguinte, formatTimestamp mantém o dia certo.
    expect(formatTimestamp("2026-09-02T01:30:00.000Z")).toBe("01/09/2026 22:30");
  });
});
