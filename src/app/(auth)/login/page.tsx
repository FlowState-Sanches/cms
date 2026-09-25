import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | FlowState CMS",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expirada?: string }>;
}) {
  const { expirada } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4 py-12 md:px-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">FlowState CMS</h1>
        <p className="text-sm text-text-muted">
          Entre com a conta da Trilha de Aprendizado.
        </p>
      </div>
      <LoginForm sessaoExpirada={expirada === "1"} />
    </div>
  );
}
