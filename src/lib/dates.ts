/**
 * Datas do painel. As datas da API são relógio de parede (`YYYY-MM-DD`, sem
 * fuso, H6); "hoje" é o dia civil em `America/Sao_Paulo`. Toda conta de
 * calendário usa UTC para não depender do fuso do servidor.
 */

const SAO_PAULO = "America/Sao_Paulo";
// Anos 2000 a 2099: evita que `Date.UTC` trate "0024" como 1924.
const DATE_RE = /^(20\d{2})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^20\d{2}-(0[1-9]|1[0-2])$/;

const TODAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAO_PAULO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const DAY_LONG = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const WEEKDAY_LONG = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const MONTH_TITLE = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function monthParts(month: string): [number, number] {
  const [year, monthIndex] = month.split("-").map(Number);
  return [year ?? 1970, monthIndex ?? 1];
}

/** Dia civil de hoje em São Paulo, `YYYY-MM-DD`. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return TODAY_FORMAT.format(now);
}

export function isIsoDate(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  const match = DATE_RE.exec(value);
  if (!match) {
    return false;
  }
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return isoDay(date) === value;
}

export function isIsoMonth(value: string | undefined): value is string {
  return value !== undefined && MONTH_RE.test(value);
}

export function daysInMonth(month: string): number {
  const [year, monthIndex] = monthParts(month);
  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
}

/** Primeiro e último dia do mês (intervalo de `GET /cms/calendar`, sempre abaixo de 62 dias). */
export function monthRange(month: string): { from: string; to: string } {
  const last = String(daysInMonth(month)).padStart(2, "0");
  return { from: `${month}-01`, to: `${month}-${last}` };
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = monthParts(month);
  return isoDay(new Date(Date.UTC(year, monthIndex - 1 + delta, 1))).slice(0, 7);
}

/** Semanas do mês (domingo a sábado); `null` preenche antes do dia 1 e depois do último. */
export function monthWeeks(month: string): (string | null)[][] {
  const [year, monthIndex] = monthParts(month);
  const leading = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay();
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  const total = daysInMonth(month);
  for (let day = 1; day <= total; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/**
 * Mês e dia do painel a partir da URL (`?mes=YYYY-MM&dia=YYYY-MM-DD`).
 * Valor inválido é ignorado. O dia selecionado é sempre do mês exibido:
 * o da URL, senão hoje (se hoje cair no mês), senão o dia 1.
 */
export function resolveCalendarDates(
  params: { mes?: string; dia?: string },
  today: string,
): { month: string; day: string } {
  const day = isIsoDate(params.dia) ? params.dia : undefined;
  const month = isIsoMonth(params.mes) ? params.mes : (day ?? today).slice(0, 7);
  if (day && day.startsWith(month)) {
    return { month, day };
  }
  if (today.startsWith(month)) {
    return { month, day: today };
  }
  return { month, day: `${month}-01` };
}

export function formatDayLong(date: string): string {
  return DAY_LONG.format(toUtc(date));
}

export function formatWeekdayLong(date: string): string {
  return WEEKDAY_LONG.format(toUtc(date));
}

export function formatMonthTitle(month: string): string {
  return MONTH_TITLE.format(toUtc(`${month}-01`));
}

/** "08:00:00" ou "08:00" vira "08:00". */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}
