/**
 * Monta a query string das chamadas à API, na ordem das chaves. Valor
 * `undefined` ou string vazia fica de fora (filtro não aplicado).
 */
export function buildQuery(
  query: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
