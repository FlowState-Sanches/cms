import { describe, expect, it } from "vitest";
import {
  ACTION_LABELS,
  PILLAR_ORDER,
  STATUS_LABELS,
  formatDate,
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
});
