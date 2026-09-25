import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CalendarDay } from "@/lib/api/admin-schemas";
import { MonthCalendar, dayAriaLabel, dayKinds } from "./month-calendar";

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

describe("MonthCalendar no celular (Review Focus 4)", () => {
  it("sem largura mínima abaixo de 768 px e cada dia com alvo de 44 px", () => {
    renderCalendar();
    const table = screen.getByRole("table", { name: /^Calendário de setembro/ });
    expect(table).toHaveClass("md:min-w-[560px]");
    expect(table).not.toHaveClass("min-w-[560px]");
    expect(screen.getByRole("link", { name: /^24 de setembro/ })).toHaveClass("min-h-11");
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveClass(
      "min-h-11",
      "lg:min-h-0",
    );
  });

  it("mostra pontos por tipo e esconde o texto de contagem; o aria-label segue completo", () => {
    renderCalendar();
    const busy = screen.getByRole("link", {
      name: "24 de setembro (hoje): 3 aulas, 1 evento, 42 mídias",
    });
    const dots = Array.from(busy.querySelectorAll("[data-dot]")).map((dot) =>
      dot.getAttribute("data-dot"),
    );
    expect(dots).toEqual(["aulas", "eventos", "midias"]);
    expect(busy.querySelector("[data-dot]")?.parentElement).toHaveAttribute("aria-hidden", "true");
    expect(busy.querySelector("[data-dot]")?.parentElement).toHaveClass("md:hidden");
    expect(within(busy).getByText("3 aulas")).toHaveClass("hidden", "md:block");

    const empty = screen.getByRole("link", { name: "1 de setembro: sem atividades" });
    expect(empty.querySelector("[data-dot]")).toBeNull();
  });

  it("legenda dos pontos só no celular e fora da árvore de acessibilidade", () => {
    renderCalendar();
    const legend = document.querySelector("[data-legend]");
    expect(legend).toHaveAttribute("aria-hidden", "true");
    expect(legend).toHaveClass("md:hidden");
    expect(legend).toHaveTextContent("AulasEventosMídias");
  });
});

describe("dayKinds", () => {
  it("lista os tipos com atividade, na ordem aulas, eventos, mídias", () => {
    expect(dayKinds(busyDay)).toEqual(["aulas", "eventos", "midias"]);
    expect(
      dayKinds({ ...busyDay, lessons: 0, groupClasses: 0, events: 0, photos: 0, videos: 1 }),
    ).toEqual(["midias"]);
    expect(dayKinds(undefined)).toEqual([]);
  });
});
