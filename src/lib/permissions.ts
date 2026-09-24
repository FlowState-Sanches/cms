import type { CmsAccess, CmsTraining } from "./api/schemas";

/**
 * Espelho da matriz de permissão do Contrato CMS, só para decidir o que a UI
 * mostra. A API é quem autoriza de verdade: esconder um botão aqui nunca
 * substitui a checagem do servidor.
 */

type TrainingPermissionFields = Pick<
  CmsTraining,
  "status" | "author" | "publishedAt" | "hasCompletions"
>;

export type StatusActionKey =
  "submeter" | "publicar" | "devolver" | "despublicar" | "arquivar" | "excluir";

function isAuthor(
  training: TrainingPermissionFields,
  access: CmsAccess,
): boolean {
  return training.author?.id === access.user.id;
}

/** Editar conteúdo/vídeo: professor só o próprio em rascunho; admin qualquer, exceto arquivado. */
export function canEditTraining(
  training: TrainingPermissionFields,
  access: CmsAccess,
): boolean {
  if (access.canCurate) {
    return training.status !== "archived";
  }
  return isAuthor(training, access) && training.status === "draft";
}

/** Ações de status disponíveis, na ordem de exibição. */
export function availableStatusActions(
  training: TrainingPermissionFields,
  access: CmsAccess,
): StatusActionKey[] {
  const admin = access.canCurate;
  const author = isAuthor(training, access);
  const { status } = training;
  const actions: StatusActionKey[] = [];

  if (status === "draft" && (admin || author)) {
    actions.push("submeter");
  }
  if (admin && (status === "draft" || status === "review")) {
    actions.push("publicar");
  }
  if (admin && status === "review") {
    actions.push("devolver");
  }
  if (admin && status === "published") {
    actions.push("despublicar");
  }
  if (admin && status !== "archived") {
    actions.push("arquivar");
  }
  if (
    status === "draft" &&
    training.publishedAt === null &&
    !training.hasCompletions &&
    (admin || author)
  ) {
    actions.push("excluir");
  }

  return actions;
}
