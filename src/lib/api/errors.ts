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
