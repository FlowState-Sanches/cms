import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CalendarDayDetail } from "@/lib/api/admin-schemas";
import { DayAgenda } from "./day-agenda";

const professor = { id: "p1", name: "Ana Prof" };

const day: CalendarDayDetail = {
  date: "2026-09-24",
  lessons: [
    {
      id: "b1",
      startTime: "08:00:00",
      endTime: "09:00:00",
      location: "Praia Mole",
      professor,
      student: { id: "a1", name: "Bruno Aluno" },
    },
  ],
  groupClasses: [
    {
      id: "g1",
      name: "Aula de iniciantes",
      category: "aula_grupo",
      startTime: "10:00",
      endTime: "11:30",
      location: null,
      professor,
      maxSpots: 8,
      takenSpots: 3,
    },
  ],
  events: [],
  sessions: [
    {
      id: "s1",
      location: "Joaquina",
      startTime: null,
      endTime: null,
      photographer: { id: "f1", name: "Carla Foto" },
      photoCount: 40,
      videoCount: 2,
      coverUrl: null,
    },
  ],
};

describe("DayAgenda", () => {
  it("mostra o dia por extenso e cada seção com itens", () => {
    render(<DayAgenda day={day} />);
    expect(
      screen.getByRole("heading", { name: "Agenda de quinta-feira, 24 de setembro" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aulas" })).toBeInTheDocument();
    expect(screen.getByText("08:00 às 09:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bruno Aluno" })).toHaveAttribute(
      "href",
      "/alunos/a1",
    );
    expect(screen.getByText("3 de 8 vagas preenchidas")).toBeInTheDocument();
    expect(screen.getByText("40 fotos, 2 vídeos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver mídias da sessão em Joaquina" }),
    ).toHaveAttribute("href", "/midias?dia=2026-09-24&fotografo=f1");
  });

  it("esconde seção vazia", () => {
    render(<DayAgenda day={day} />);
    expect(screen.queryByRole("heading", { name: "Eventos" })).not.toBeInTheDocument();
  });

  it("dia sem nada mostra o estado vazio", () => {
    render(
      <DayAgenda
        day={{ date: "2026-09-25", lessons: [], groupClasses: [], events: [], sessions: [] }}
      />,
    );
    expect(screen.getByText("Nada agendado neste dia.")).toBeInTheDocument();
  });
});
