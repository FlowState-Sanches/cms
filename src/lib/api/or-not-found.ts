import { notFound } from "next/navigation";
import { ApiError } from "./errors";

/**
 * Carrega um recurso do detalhe. 404 da API (id inexistente ou
 * soft-deletado) vira `notFound()`; qualquer outro erro, inclusive o
 * redirect de sessão expirada lançado por `authedRequest`, sobe intacto.
 */
export async function orNotFound<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
