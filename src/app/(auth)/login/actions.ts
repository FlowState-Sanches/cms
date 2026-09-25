"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { ApiError, messageFor } from "@/lib/api/errors";
import { cmsAccessSchema, loginResponseSchema } from "@/lib/api/schemas";
import { homePathFor } from "@/lib/permissions";
import { clearSession, setSession } from "@/lib/session";

const loginInputSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha.").max(72, "Senha inválida."),
});

// Só erro da API vira mensagem no formulário. Qualquer outro (env inválido, resposta
// fora do schema, rede) é defeito de ambiente ou de código: registra no log do servidor
// e propaga para a fronteira de erro, em vez de se passar por "tente de novo".
function rethrowUnlessApiError(error: unknown): asserts error is ApiError {
  if (!(error instanceof ApiError)) {
    console.error("[login] falha fora da API ao entrar no CMS:", error);
    throw error;
  }
}

export type LoginActionState = {
  error: string;
} | null;

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "E-mail ou senha incorretos." };
  }

  let accessToken: string;
  try {
    const login = await apiRequest("/auth/login", loginResponseSchema, {
      method: "POST",
      body: parsed.data,
    });
    accessToken = login.accessToken;
  } catch (error) {
    rethrowUnlessApiError(error);
    if (error.status === 401) {
      return { error: "E-mail ou senha incorretos." };
    }
    return { error: messageFor(error) };
  }

  await setSession(accessToken);

  let home: "/painel" | "/treinos";
  try {
    const access = await apiRequest("/cms/trilha/acesso", cmsAccessSchema, {
      token: accessToken,
    });

    if (!access.canEdit) {
      await clearSession();
      return {
        error:
          "Sua conta não tem acesso ao CMS da Trilha. Fale com a curadoria FlowState.",
      };
    }
    home = homePathFor(access);
  } catch (error) {
    await clearSession();
    rethrowUnlessApiError(error);
    return { error: messageFor(error) };
  }

  redirect(home);
}
