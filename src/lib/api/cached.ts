import "server-only";
import { cache } from "react";
import { cmsApi } from "./client";

/**
 * `cmsApi.access()`/`cmsApi.pillars()` são lidos tanto pelo layout
 * `(cms)` (permissão, contagem da fila de revisão) quanto pela página
 * `treinos` (permissão para "Reordenar pilar", contagem por pilar nas
 * abas). `React.cache` deduplica as duas chamadas dentro da mesma
 * requisição/render, sem esconder o redirect de 401: `authedRequest`
 * (chamado dentro de `cmsApi`) continua lançando o `redirect` do Next
 * normalmente, e nada aqui captura exceções.
 */
export const getAccess = cache(() => cmsApi.access());
export const getPillars = cache(() => cmsApi.pillars());

/**
 * Porta das páginas de `(admin)`: o layout do grupo mostra `SemAcesso`, mas
 * layout não impede a página de rodar (docs do Next, "Layouts and auth
 * checks"). Cada página chama isto antes de buscar dados; `getAccess` é
 * deduplicado por `React.cache`, então custa uma chamada por requisição.
 */
export async function isCurator(): Promise<boolean> {
  const access = await getAccess();
  return access.canCurate;
}
