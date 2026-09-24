import { describe, expect, it } from "vitest";
import type { CmsAccess, TrainingStatus } from "./api/schemas";
import { availableStatusActions, canEditTraining } from "./permissions";

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
    status,
    author: { id: authorId, name: "Autor" },
    publishedAt: null,
    hasCompletions: false,
  };
}

describe("canEditTraining", () => {
  it.each([
    ["draft", true],
    ["review", false],
    ["published", false],
    ["archived", false],
  ] as const)("professor autor em %s: %s", (status, expected) => {
    expect(canEditTraining(training(status), professor)).toBe(expected);
  });

  it("professor não edita rascunho de outro autor", () => {
    expect(canEditTraining(training("draft", "outro"), professor)).toBe(false);
  });

  it.each([
    ["draft", true],
    ["review", true],
    ["published", true],
    ["archived", false],
  ] as const)("admin em %s: %s", (status, expected) => {
    expect(canEditTraining(training(status, "outro"), admin)).toBe(expected);
  });
});

describe("availableStatusActions", () => {
  it("excluir some quando já foi publicado ou tem conclusões", () => {
    expect(
      availableStatusActions(
        { ...training("draft"), publishedAt: "2026-01-01T00:00:00Z" },
        professor,
      ),
    ).toEqual(["submeter"]);
    expect(
      availableStatusActions(
        { ...training("draft"), hasCompletions: true },
        professor,
      ),
    ).toEqual(["submeter"]);
  });

  it("treino sem autor: professor não vê ações", () => {
    expect(
      availableStatusActions({ ...training("draft"), author: null }, professor),
    ).toEqual([]);
  });
});
