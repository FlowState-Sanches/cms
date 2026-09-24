import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isCurator: vi.fn(),
  adminApi: { summary: vi.fn(), calendar: vi.fn(), calendarDay: vi.fn() },
}));
vi.mock("@/lib/api/cached", () => ({ isCurator: mocks.isCurator }));
vi.mock("@/lib/api/admin-client", () => ({ adminApi: mocks.adminApi }));

import PainelPage from "./page";

const summary = {
  people: {
    students: { total: 120, paid: 30 },
    professors: { total: 14, verified: 9 },
    photographers: { total: 5 },
    admins: { total: 2 },
    blocked: { total: 1 },
  },
  lessons: { today: 3, next7Days: 18, thisMonth: 40, cancelledThisMonth: 2 },
  groupClasses: { upcoming: 4 },
  events: { upcoming: 1 },
  media: { today: { photos: 40, videos: 2 } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCurator.mockResolvedValue(true);
  mocks.adminApi.summary.mockResolvedValue(summary);
  mocks.adminApi.calendar.mockResolvedValue({ days: [] });
  mocks.adminApi.calendarDay.mockResolvedValue({
    date: "2026-09-24",
    lessons: [],
    groupClasses: [],
    events: [],
    sessions: [],
  });
});

describe("PainelPage", () => {
  it("busca o mês e o dia da URL e mostra resumo, calendário e agenda", async () => {
    render(
      await PainelPage({
        searchParams: Promise.resolve({ mes: "2026-09", dia: "2026-09-24" }),
      }),
    );

    expect(mocks.adminApi.calendar).toHaveBeenCalledWith("2026-09-01", "2026-09-30");
    expect(mocks.adminApi.calendarDay).toHaveBeenCalledWith("2026-09-24");
    expect(screen.getByRole("heading", { level: 1, name: "Painel" })).toBeInTheDocument();

    const people = screen.getByRole("region", { name: "Pessoas" });
    expect(within(people).getByRole("link", { name: /Alunos/ })).toHaveAttribute(
      "href",
      "/alunos",
    );
    expect(within(people).getByText("30 pagos")).toBeInTheDocument();

    const lessons = screen.getByRole("region", { name: "Aulas e eventos" });
    expect(within(lessons).getByText("2 canceladas")).toBeInTheDocument();
    expect(within(lessons).getByText("40 fotos, 2 vídeos")).toBeInTheDocument();

    expect(
      screen.getByRole("table", { name: /Calendário de setembro de 2026/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute(
      "href",
      "/painel?mes=2026-08",
    );
    expect(screen.getByText("Nada agendado neste dia.")).toBeInTheDocument();
  });

  it("parâmetros inválidos caem no mês de hoje sem quebrar", async () => {
    render(
      await PainelPage({ searchParams: Promise.resolve({ mes: "2026-13", dia: "x" }) }),
    );
    const [from, to] = mocks.adminApi.calendar.mock.calls[0] as [string, string];
    expect(from).toMatch(/^20\d{2}-\d{2}-01$/);
    expect(to.slice(0, 7)).toBe(from.slice(0, 7));
  });

  it("sem curadoria não chama a API", async () => {
    mocks.isCurator.mockResolvedValue(false);
    const ui = await PainelPage({ searchParams: Promise.resolve({}) });
    expect(ui).toBeNull();
    expect(mocks.adminApi.summary).not.toHaveBeenCalled();
  });
});
