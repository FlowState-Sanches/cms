import { redirect } from "next/navigation";
import { getAccess } from "@/lib/api/cached";
import { homePathFor } from "@/lib/permissions";

/**
 * `/` decide o destino pelo papel lido da API (o proxy não tem esse dado,
 * só o cookie). Sem cookie, o proxy já mandou para /login; com 401,
 * `getAccess` redireciona para /sessao-expirada.
 */
export default async function Home(): Promise<never> {
  const access = await getAccess();
  redirect(homePathFor(access));
}
