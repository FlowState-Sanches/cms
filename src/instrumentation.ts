// Roda uma vez quando o servidor Next sobe (dev e produção, não no build). Validar o
// ambiente aqui faz `npm run dev`/`next start` falharem logo, com a mensagem do Zod,
// em vez de o CMS subir e cada chamada à API quebrar com erro genérico.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("./lib/env");
  env();
}
