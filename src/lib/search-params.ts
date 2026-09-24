/** `searchParams` resolvido de uma página do App Router. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** `?q=a&q=b` chega como array: vale o primeiro. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

const MAX_SEARCH_LENGTH = 100;

/** Busca por nome ou e-mail: aparada, vazia vira ausente, no máximo 100 caracteres. */
export function parseSearch(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

/** Traduz um parâmetro de URL por um mapa fechado; valor fora do mapa é ignorado. */
export function parseOption<T>(
  value: string | undefined,
  options: Readonly<Record<string, T>>,
): T | undefined {
  if (value === undefined || !Object.hasOwn(options, value)) {
    return undefined;
  }
  return options[value];
}

/** Monta o href de uma lista preservando filtros; omite vazio e `pagina` 1. */
export function hrefWith(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    if (key === "pagina" && Number(value) <= 1) {
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
