export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-background px-6 text-center font-sans">
      <h1 className="font-display text-3xl font-semibold text-text">
        FlowState CMS
      </h1>
      <p className="max-w-md text-text-muted">
        Cadastro e curadoria de exercícios da Trilha de Aprendizado.
      </p>
    </div>
  );
}
