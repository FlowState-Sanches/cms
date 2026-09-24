import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Alvo do redirect de `authedRequest` quando a API responde 401. Existe como
 * Route Handler (em vez de apagar o cookie direto em `authedRequest`) porque
 * `authedRequest` também roda durante a renderização de Server Components, e
 * o Next 16 não permite `cookies().delete()` fora de Server Actions/Route
 * Handlers (lança `ReadonlyRequestCookiesError`). Aqui a mutação do cookie é
 * sempre segura.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?expirada=1", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
