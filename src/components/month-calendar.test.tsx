import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/lib/api/admin-schemas";
import { MonthCalendar, dayAriaLabel } from "./month-calendar";

const busyDay: CalendarDay = {
  date: "2026-09-24",
  lessons: 2,
  groupClasses: 1,
  events: 1,
  sessions: 2,
  photos: 40,
  videos: 2,
};

function renderCalendar(selected = "2026-09-24") {
  render(
    <MonthCalendar
      month="2026-09"
      days={[busyDay, { ...busyDay, date: "2026-09-10", lessons: 1, groupClasses: 0, events: 0, photos: 0, videos: 0 }]}
      selected={selected}
      today="2026-09-24"
      hrefFor={(date) => `/painel?mes=2026-09&dia=${date}`}
      prevHref="/painel?mes=2026-08"
      nextHref="/painel?mes=2026-10"
    />,
  );
}

describe("MonthCalendar", () => {
  it("é uma tabela com legenda e cabeçalho dos 7 dias", () => {
    renderCalendar();
    const table = screen.getByRole("table", {
      name: "Calendário de setembro de 2026: aulas, eventos e mídias por dia",
    });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Dom",
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
    ]);
    expect(headers[0]).toHaveAttribute("abbr", "domingo");
  });

  it("cada dia é um link com aria-label descritivo", () => {
    renderCalendar();
    const today = screen.getByRole("link", {
      name: "24 de setembro (hoje): 3 aulas, 1 evento, 42 mídias",
    });
    expect(today).toHaveAttribute("href", "/painel?mes=2026-09&dia=2026-09-24");
    expect(screen.getByRole("link", { name: "10 de setembro: 1 aula" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "1 de setembro: sem atividades" }),
    ).toBeInTheDocument();
  });

  it("só o dia selecionado leva aria-current=date", () => {
    renderCalendar("2026-09-10");
    expect(screen.getByRole("link", { name: /^10 de setembro/ })).toHaveAttribute(
      "aria-current",
      "date",
    );
    expect(screen.getByRole("link", { name: /^24 de setembro/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("células antes do dia 1 ficam sem link e os meses vizinhos têm navegação", () => {
    renderCalendar();
    const firstRow = screen.getAllByRole("row")[1];
    const cells = within(firstRow!).getAllByRole("cell");
    expect(cells).toHaveLength(7);
    expect(within(cells[0]!).queryByRole("link")).not.toBeInTheDocument();
    expect(within(cells[1]!).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute(
      "href",
      "/painel?mes=2026-08",
    );
    expect(screen.getByRole("link", { name: "Próximo mês" })).toHaveAttribute(
      "href",
      "/painel?mes=2026-10",
    );
  });
});

describe("dayAriaLabel", () => {
  it("usa singular e omite contagens zeradas", () => {
    expect(
      dayAriaLabel(
        "2026-09-05",
        { ...busyDay, date: "2026-09-05", lessons: 0, groupClasses: 0, events: 1, photos: 1, videos: 0 },
        false,
      ),
    ).toBe("5 de setembro: 1 evento, 1 mídia");
  });
});
