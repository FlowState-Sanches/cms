import "server-only";
import { cookies } from "next/headers";
import { env } from "./env";

export const SESSION_COOKIE = "fs_cms_session";

const MIN_MAX_AGE = 60;

/**
 * Decodifica o payload de um JWT sem verificar assinatura, só para ler `exp`
 * e calcular o `maxAge` do cookie de sessão. Nunca use isto para confiar no
 * conteúdo do token: quem valida a assinatura é a API.
 */
function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  const payloadPart = parts[1];
  if (parts.length !== 3 || !payloadPart) {
    return null;
  }
  try {
    const payloadJson = Buffer.from(payloadPart, "base64url").toString("utf8");
    const payload: unknown = JSON.parse(payloadJson);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
    ) {
      return (payload as { exp: number }).exp;
    }
    return null;
  } catch {
    return null;
  }
}

/** `maxAge` (em segundos) do cookie de sessão a partir do `exp` do JWT. */
export function tokenMaxAge(token: string, nowMs: number): number {
  const exp = decodeJwtExp(token);
  if (exp === null) {
    return MIN_MAX_AGE;
  }
  const maxAge = Math.floor(exp - nowMs / 1000);
  return Math.max(MIN_MAX_AGE, maxAge);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().NODE_ENV === "production",
    path: "/",
    maxAge: tokenMaxAge(token, Date.now()),
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
