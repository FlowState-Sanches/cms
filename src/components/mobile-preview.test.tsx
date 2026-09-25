import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TrainingFormValues } from "@/lib/training-schema";
import { MobilePreview } from "./mobile-preview";

const values: TrainingFormValues = {
  pillar: "tecnico",
  code: "T9",
  title: "Leitura de jogo",
  subtitle: "Antecipar a jogada",
  levelLabel: "Iniciante",
  durationMinutes: 15,
  summary: "Aprenda a ler o jogo antes da bola chegar.",
  learnings: [{ value: "Olhar antes de receber" }],
  coach: { quote: "Quem vê antes decide melhor.", author: "Coach Ana" },
  unlockHint: "Conclua o treino anterior",
  selfAssessment: [{ value: "Você olhou antes de receber?" }],
  reference: { enabled: false, title: "", provider: "", url: "" },
};

describe("MobilePreview", () => {
  it("mostra título, nível, duração, resumo, aprendizados e frase do coach", () => {
    render(<MobilePreview values={values} demoVideoUrl={null} />);

    expect(
      screen.getByRole("region", { name: "Pré-visualização no app" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leitura de jogo")).toBeInTheDocument();
    expect(screen.getByText("Iniciante")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
    expect(screen.getByText(values.summary)).toBeInTheDocument();
    expect(screen.getByText("Olhar antes de receber")).toBeInTheDocument();
    expect(
      screen.getByText("“Quem vê antes decide melhor.”"),
    ).toBeInTheDocument();
    expect(screen.getByText("Coach Ana")).toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeInTheDocument();
  });

  it("com vídeo mostra o player", () => {
    render(
      <MobilePreview values={values} demoVideoUrl="https://cdn/demo.mp4" />,
    );

    const video = document.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("src", "https://cdn/demo.mp4");
  });

  it("centralizada com largura máxima abaixo de 1024 px", () => {
    render(<MobilePreview values={{ ...values, title: "T".repeat(80) }} demoVideoUrl={null} />);
    expect(screen.getByRole("region", { name: "Pré-visualização no app" })).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-sm",
      "lg:max-w-none",
    );
    expect(screen.getByText("T".repeat(80))).toHaveClass("wrap-anywhere");
  });
});
