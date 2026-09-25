import Link from "next/link";
import type { CalendarDay } from "@/lib/api/admin-schemas";
import { plural } from "@/lib/admin-labels";
import { formatDayLong, formatMonthTitle, monthWeeks } from "@/lib/dates";

const WEEKDAYS = [
  { short: "Dom", full: "domingo" },
  { short: "Seg", full: "segunda-feira" },
  { short: "Ter", full: "terça-feira" },
  { short: "Qua", full: "quarta-feira" },
  { short: "Qui", full: "quinta-feira" },
  { short: "Sex", full: "sexta-feira" },
  { short: "Sáb", full: "sábado" },
] as const;

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-md border border-border px-3 py-1.5 text-text hover:border-primary lg:min-h-0";

export type DayKind = "aulas" | "eventos" | "midias";

const DAY_KINDS: DayKind[] = ["aulas", "eventos", "midias"];

const DOT_CLASS: Record<DayKind, string> = {
  aulas: "bg-primary",
  eventos: "bg-accent",
  midias: "bg-text-muted",
};

const KIND_LABEL: Record<DayKind, string> = {
  aulas: "Aulas",
  eventos: "Eventos",
  midias: "Mídias",
};

/** Contadores visíveis de um dia: aulas (particulares + em grupo), eventos, mídias. */
export function dayCounts(day: CalendarDay | undefined): string[] {
  if (!day) {
    return [];
  }
  const parts: string[] = [];
  const lessons = day.lessons + day.groupClasses;
  const media = day.photos + day.videos;
  if (lessons > 0) {
    parts.push(plural(lessons, "aula", "aulas"));
  }
  if (day.events > 0) {
    parts.push(plural(day.events, "evento", "eventos"));
  }
  if (media > 0) {
    parts.push(plural(media, "mídia", "mídias"));
  }
  return parts;
}

/** Tipos com atividade no dia, para os pontos do celular (spec 5.3). */
export function dayKinds(day: CalendarDay | undefined): DayKind[] {
  if (!day) {
    return [];
  }
  const kinds: DayKind[] = [];
  if (day.lessons + day.groupClasses > 0) {
    kinds.push("aulas");
  }
  if (day.events > 0) {
    kinds.push("eventos");
  }
  if (day.photos + day.videos > 0) {
    kinds.push("midias");
  }
  return kinds;
}

/** "24 de setembro (hoje): 3 aulas, 1 evento, 42 mídias" (spec 5.3). */
export function dayAriaLabel(
  date: string,
  day: CalendarDay | undefined,
  isToday: boolean,
): string {
  const counts = dayCounts(day);
  const name = `${formatDayLong(date)}${isToday ? " (hoje)" : ""}`;
  return `${name}: ${counts.length > 0 ? counts.join(", ") : "sem atividades"}`;
}

type MonthCalendarProps = {
  month: string;
  days: CalendarDay[];
  selected: string;
  today: string;
  hrefFor: (date: string) => string;
  prevHref: string;
  nextHref: string;
};

/**
 * Grade mensal do painel. Server Component sem estado: cada dia é um link
 * que muda `?dia=` na URL. A tabela tem legenda e cabeçalho de dias para
 * leitor de tela; o dia selecionado leva `aria-current="date"`. Abaixo de
 * 768 px a tabela perde a largura mínima e cada dia mostra só o número e
 * pontos por tipo; o `aria-label` do dia continua com as contagens.
 */
export function MonthCalendar({
  month,
  days,
  selected,
  today,
  hrefFor,
  prevHref,
  nextHref,
}: MonthCalendarProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const title = formatMonthTitle(month);

  return (
    <section aria-labelledby="calendario-titulo" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="calendario-titulo"
          className="font-display text-lg font-semibold capitalize text-text"
        >
          {title}
        </h2>
        <nav aria-label="Navegar entre meses" className="flex gap-2 text-sm">
          <Link href={prevHref} className={NAV_LINK}>
            Mês anterior
          </Link>
          <Link href={nextHref} className={NAV_LINK}>
            Próximo mês
          </Link>
        </nav>
      </div>

      <div
        role="region"
        aria-label="Calendário do mês"
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <table className="w-full table-fixed border-collapse text-sm md:min-w-[560px]">
          <caption className="sr-only">
            {`Calendário de ${title}: aulas, eventos e mídias por dia`}
          </caption>
          <thead>
            <tr>
              {WEEKDAYS.map((weekday) => (
                <th
                  key={weekday.short}
                  scope="col"
                  abbr={weekday.full}
                  className="px-1 py-2 text-xs font-medium uppercase text-text-muted"
                >
                  {weekday.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthWeeks(month).map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((date, cellIndex) => {
                  if (date === null) {
                    return (
                      <td
                        key={`vazio-${weekIndex}-${cellIndex}`}
                        className="h-12 border border-border/40 md:h-20"
                      />
                    );
                  }
                  const day = byDate.get(date);
                  const kinds = dayKinds(day);
                  const isSelected = date === selected;
                  const isToday = date === today;
                  return (
                    <td
                      key={date}
                      className="h-12 border border-border/40 p-0 align-top md:h-20"
                    >
                      <Link
                        href={hrefFor(date)}
                        aria-label={dayAriaLabel(date, day, isToday)}
                        aria-current={isSelected ? "date" : undefined}
                        className={`flex h-full min-h-11 flex-col items-center gap-1 p-1 text-left hover:bg-surface md:items-stretch md:gap-0.5 md:p-1.5 ${
                          isSelected ? "bg-primary-soft ring-1 ring-inset ring-primary" : ""
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${isToday ? "text-accent" : "text-text"}`}
                        >
                          {Number(date.slice(8))}
                        </span>
                        {kinds.length > 0 && (
                          <span
                            aria-hidden="true"
                            className="flex flex-wrap justify-center gap-0.5 md:hidden"
                          >
                            {kinds.map((kind) => (
                              <span
                                key={kind}
                                data-dot={kind}
                                className={`size-1.5 rounded-full ${DOT_CLASS[kind]}`}
                              />
                            ))}
                          </span>
                        )}
                        {dayCounts(day).map((count) => (
                          <span
                            key={count}
                            className="hidden truncate text-[11px] text-text-muted md:block"
                          >
                            {count}
                          </span>
                        ))}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        aria-hidden="true"
        data-legend=""
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted md:hidden"
      >
        {DAY_KINDS.map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${DOT_CLASS[kind]}`} />
            {KIND_LABEL[kind]}
          </span>
        ))}
      </p>
    </section>
  );
}
