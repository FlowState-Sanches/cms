"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { ApiError, messageFor } from "@/lib/api/errors";
import { cmsAccessSchema, loginResponseSchema } from "@/lib/api/schemas";
import { clearSession, setSession } from "@/lib/session";

const loginInputSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha.").max(72, "Senha inválida."),
});

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
    if (error instanceof ApiError && error.status === 401) {
      return { error: "E-mail ou senha incorretos." };
    }
    return { error: messageFor(error) };
  }

  await setSession(accessToken);

  try {
    const access = await apiRequest("/cms/trilha/acesso", cmsAccessSchema, {
      token: accessToken,
    });

    if (!access.canEdit) {
      await clearSession();
      return {
        error: "Sua conta não tem acesso ao CMS da Trilha. Fale com a curadoria FlowState.",
      };
    }
  } catch (error) {
    await clearSession();
    return { error: messageFor(error) };
  }

  redirect("/treinos");
}
