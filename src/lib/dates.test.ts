import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  formatDayLong,
  formatMonthTitle,
  formatTime,
  formatWeekdayLong,
  isIsoDate,
  isIsoMonth,
  monthRange,
  monthWeeks,
  resolveCalendarDates,
  shiftMonth,
  todayInSaoPaulo,
} from "./dates";

describe("todayInSaoPaulo", () => {
  it("23h30 em São Paulo ainda é o mesmo dia, mesmo já sendo amanhã em UTC", () => {
    expect(todayInSaoPaulo(new Date("2026-09-25T02:30:00Z"))).toBe("2026-09-24");
  });

  it("03h01 UTC já é o dia seguinte em São Paulo", () => {
    expect(todayInSaoPaulo(new Date("2026-09-25T03:01:00Z"))).toBe("2026-09-25");
  });
});

describe("validação", () => {
  it.each([
    ["2026-09-24", true],
    ["2028-02-29", true],
    ["2026-02-29", false],
    ["2026-02-30", false],
    ["2026-9-1", false],
    ["24/09/2026", false],
    ["1999-01-01", false],
  ])("isIsoDate(%s) = %s", (value, expected) => {
    expect(isIsoDate(value)).toBe(expected);
  });

  it("isIsoDate(undefined) é false", () => {
    expect(isIsoDate(undefined)).toBe(false);
  });

  it.each([
    ["2026-09", true],
    ["2026-13", false],
    ["2026-00", false],
    ["26-09", false],
  ])("isIsoMonth(%s) = %s", (value, expected) => {
    expect(isIsoMonth(value)).toBe(expected);
  });
});

describe("mês", () => {
  it("daysInMonth e monthRange consideram ano bissexto", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthRange("2026-09")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("shiftMonth atravessa o ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("monthWeeks de setembro de 2026 começa numa terça (2 células vazias)", () => {
    const weeks = monthWeeks("2026-09");
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      null,
      null,
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
    ]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("fevereiro de 2026 cabe em 4 semanas e maio de 2026 precisa de 6", () => {
    expect(monthWeeks("2026-02")).toHaveLength(4);
    expect(monthWeeks("2026-05")).toHaveLength(6);
  });
});

describe("resolveCalendarDates", () => {
  const today = "2026-09-24";

  it("sem parâmetros usa hoje", () => {
    expect(resolveCalendarDates({}, today)).toEqual({ month: "2026-09", day: today });
  });

  it("mês sem o dia de hoje seleciona o dia 1", () => {
    expect(resolveCalendarDates({ mes: "2026-10" }, today)).toEqual({
      month: "2026-10",
      day: "2026-10-01",
    });
  });

  it("dia sem mês usa o mês do dia", () => {
    expect(resolveCalendarDates({ dia: "2026-08-15" }, today)).toEqual({
      month: "2026-08",
      day: "2026-08-15",
    });
  });

  it("dia fora do mês pedido cai no fallback do mês", () => {
    expect(resolveCalendarDates({ mes: "2026-09", dia: "2026-10-02" }, today)).toEqual({
      month: "2026-09",
      day: today,
    });
  });

  it("lixo na URL volta para hoje", () => {
    expect(resolveCalendarDates({ mes: "2026-13", dia: "2026-02-30" }, today)).toEqual({
      month: "2026-09",
      day: today,
    });
  });
});

describe("formatação pt-BR", () => {
  it("formata dia, dia da semana, mês e hora", () => {
    expect(formatDayLong("2026-09-24")).toBe("24 de setembro");
    expect(formatWeekdayLong("2026-09-24")).toBe("quinta-feira, 24 de setembro");
    expect(formatMonthTitle("2026-09")).toBe("setembro de 2026");
    expect(formatTime("08:00:00")).toBe("08:00");
  });
});
