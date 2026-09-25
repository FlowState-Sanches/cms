import type { Metadata } from "next";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { plural } from "@/lib/admin-labels";
import {
  monthRange,
  resolveCalendarDates,
  shiftMonth,
  todayInSaoPaulo,
} from "@/lib/dates";
import { firstParam, hrefWith, type SearchParams } from "@/lib/search-params";
import { DayAgenda } from "@/components/day-agenda";
import { MonthCalendar } from "@/components/month-calendar";
import { StatCard } from "@/components/stat-card";

export const metadata: Metadata = {
  title: "Painel | FlowState CMS",
};

const GRID = "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
const SECTION_TITLE = "font-display text-base font-semibold text-text";

/**
 * Painel diário do admin (spec 5.1): resumo de pessoas, métricas de aula,
 * calendário do mês e agenda do dia. Mês e dia vêm da URL
 * (`?mes=YYYY-MM&dia=YYYY-MM-DD`), com fallback para hoje em São Paulo.
 */
export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isCurator())) {
    return null;
  }

  const raw = await searchParams;
  const today = todayInSaoPaulo();
  const { month, day } = resolveCalendarDates(
    { mes: firstParam(raw.mes), dia: firstParam(raw.dia) },
    today,
  );
  const { from, to } = monthRange(month);

  const [summary, calendar, agenda] = await Promise.all([
    adminApi.summary(),
    adminApi.calendar(from, to),
    adminApi.calendarDay(day),
  ]);

  const { people, lessons, media } = summary;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text">Painel</h1>

      <section aria-labelledby="painel-pessoas" className="flex flex-col gap-3">
        <h2 id="painel-pessoas" className={SECTION_TITLE}>
          Pessoas
        </h2>
        <div className={GRID}>
          <StatCard
            label="Alunos"
            value={people.students.total}
            detail={plural(people.students.paid, "pago", "pagos")}
            href="/alunos"
          />
          <StatCard
            label="Professores"
            value={people.professors.total}
            detail={plural(people.professors.verified, "verificado", "verificados")}
            href="/professores"
          />
          <StatCard label="Fotógrafos" value={people.photographers.total} href="/fotografos" />
          <StatCard label="Admins" value={people.admins.total} href="/admins" />
          <StatCard label="Contas bloqueadas" value={people.blocked.total} />
        </div>
      </section>

      <section aria-labelledby="painel-aulas" className="flex flex-col gap-3">
        <h2 id="painel-aulas" className={SECTION_TITLE}>
          Aulas e eventos
        </h2>
        <div className={GRID}>
          <StatCard label="Aulas hoje" value={lessons.today} />
          <StatCard label="Próximos 7 dias" value={lessons.next7Days} />
          <StatCard
            label="Aulas no mês"
            value={lessons.thisMonth}
            detail={plural(lessons.cancelledThisMonth, "cancelada", "canceladas")}
          />
          <StatCard label="Aulas em grupo abertas" value={summary.groupClasses.upcoming} />
          <StatCard label="Eventos abertos" value={summary.events.upcoming} />
          <StatCard
            label="Mídias hoje"
            value={media.today.photos + media.today.videos}
            detail={`${plural(media.today.photos, "foto", "fotos")}, ${plural(media.today.videos, "vídeo", "vídeos")}`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MonthCalendar
          month={month}
          days={calendar.days}
          selected={day}
          today={today}
          hrefFor={(date) => hrefWith("/painel", { mes: month, dia: date })}
          prevHref={hrefWith("/painel", { mes: shiftMonth(month, -1) })}
          nextHref={hrefWith("/painel", { mes: shiftMonth(month, 1) })}
        />
        <DayAgenda day={agenda} />
      </div>
    </div>
  );
}
