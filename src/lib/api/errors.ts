/**
 * Erro lançado por `apiRequest`/`authedRequest` quando a API responde com
 * status de erro. Corpo padrão da API: `{ statusCode, message, code? }`.
 */
export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, message: string, code: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Mensagens de formulário em PT-BR para os códigos de erro do Contrato CMS. */
export const ERROR_MESSAGES: Record<string, string> = {
  CODE_TAKEN: "Já existe um treino com esse código.",
  INVALID_STATUS: "Essa ação não é permitida no status atual do treino.",
  SELF_ASSESSMENT_LOCKED:
    "Não é possível alterar a autoavaliação: já há alunos com essa etapa concluída.",
  USE_ARCHIVE: "Use arquivar em vez de excluir.",
  INVALID_ORDER: "A nova ordem é inválida. Recarregue a lista e tente de novo.",
  INVALID_VIDEO: "Vídeo inválido. Confira o formato e o tamanho do arquivo.",
  VIDEO_NOT_FOUND: "Vídeo não encontrado.",
  STORAGE_NOT_CONFIGURED: "Armazenamento de vídeo não está configurado.",
  // Gestão operacional (spec 2026-09-24-cms-gestao-design.md §4.4)
  ACCOUNT_BLOCKED: "Conta bloqueada. Fale com o suporte FlowState.",
  CANNOT_TARGET_SELF: "Você não pode aplicar esta ação à sua própria conta.",
  ADMIN_BLOCK_FORBIDDEN:
    "Admins não podem ser bloqueados. Revogue o acesso de admin antes.",
  LAST_ADMIN: "Não é possível revogar o último admin do CMS.",
  ALREADY_ADMIN: "Esta conta já é admin.",
  USER_NOT_FOUND: "Conta não encontrada. Ela pode ter sido excluída.",
  NOT_A_PROFESSOR: "Esta conta não tem o papel de professor.",
  MEDIA_HAS_PAID_ORDERS: "Esta mídia tem pedido pago e não pode ser removida.",
  CALENDAR_RANGE_INVALID: "Período do calendário inválido. Escolha um mês válido.",
  // Acrescentados pelo plano da API (fora da tabela §4.4 da spec)
  USER_BLOCKED: "Conta bloqueada não pode virar admin. Desbloqueie antes.",
  MEDIA_NOT_FOUND: "Mídia não encontrada. Ela pode ter sido removida.",
};

const DEFAULT_MESSAGE = "Não foi possível concluir. Tente de novo.";

/** Traduz qualquer erro (de preferência um `ApiError`) para uma mensagem PT-BR de UI. */
export function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    const mapped = error.code ? ERROR_MESSAGES[error.code] : undefined;
    if (mapped) {
      return mapped;
    }
    if (error.message) {
      return error.message;
    }
  }
  return DEFAULT_MESSAGE;
}
