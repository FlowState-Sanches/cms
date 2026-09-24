import "server-only";
import { z } from "zod";

const schema = z.object({
  API_BASE_URL: z
    .string()
    .url("API_BASE_URL precisa ser uma URL, ex.: http://localhost:3000/api/v1"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => {
      const field = issue.path.join(".");
      return field ? `${field}: ${issue.message}` : issue.message;
    });
    throw new Error(`Configuração inválida: ${messages.join("; ")}`);
  }
  return {
    ...parsed.data,
    API_BASE_URL: parsed.data.API_BASE_URL.replace(/\/$/, ""),
  };
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
