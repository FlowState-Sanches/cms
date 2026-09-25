import Link from "next/link";
import type { ReactNode } from "react";
import type {
  AgendaGroupEvent,
  AgendaLesson,
  AgendaSession,
  CalendarDayDetail,
} from "@/lib/api/admin-schemas";
import { plural } from "@/lib/admin-labels";
import { formatTime, formatWeekdayLong } from "@/lib/dates";
import { hrefWith } from "@/lib/search-params";
import { EmptyState } from "./empty-state";

const PERSON_LINK = "text-text underline-offset-2 hover:underline focus-visible:underline";

/** Aulas, aulas em grupo, eventos e sessões com mídias do dia selecionado no painel. */
export function DayAgenda({ day }: { day: CalendarDayDetail }) {
  const isEmpty =
    day.lessons.length +
      day.groupClasses.length +
      day.events.length +
      day.sessions.length ===
    0;

  return (
    <section
      aria-labelledby="agenda-titulo"
      className="flex flex-col gap-4 rounded-md border border-border p-4"
    >
      <h2 id="agenda-titulo" className="font-display text-lg font-semibold text-text">
        Agenda de {formatWeekdayLong(day.date)}
      </h2>

      {isEmpty ? (
        <EmptyState title="Nada agendado neste dia." />
      ) : (
        <>
          {day.lessons.length > 0 && (
            <AgendaSection title="Aulas">
              {day.lessons.map((lesson) => (
                <LessonItem key={lesson.id} lesson={lesson} />
              ))}
            </AgendaSection>
          )}
          {day.groupClasses.length > 0 && (
            <AgendaSection title="Aulas em grupo">
              {day.groupClasses.map((event) => (
                <GroupEventItem key={event.id} event={event} />
              ))}
            </AgendaSection>
          )}
          {day.events.length > 0 && (
            <AgendaSection title="Eventos">
              {day.events.map((event) => (
                <GroupEventItem key={event.id} event={event} />
              ))}
            </AgendaSection>
          )}
          {day.sessions.length > 0 && (
            <AgendaSection title="Sessões">
              {day.sessions.map((session) => (
                <SessionItem key={session.id} session={session} date={day.date} />
              ))}
            </AgendaSection>
          )}
        </>
      )}
    </section>
  );
}

function AgendaSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-text-muted">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function LessonItem({ lesson }: { lesson: AgendaLesson }) {
  return (
    <li className="min-w-0 rounded-md bg-surface px-3 py-2 text-sm wrap-anywhere">
      <p className="font-medium text-text">
        {formatTime(lesson.startTime)} às {formatTime(lesson.endTime)}
      </p>
      <p className="text-text-muted">
        <Link href={`/professores/${lesson.professor.id}`} className={PERSON_LINK}>
          {lesson.professor.name}
        </Link>{" "}
        com{" "}
        <Link href={`/alunos/${lesson.student.id}`} className={PERSON_LINK}>
          {lesson.student.name}
        </Link>
        {lesson.location ? `, ${lesson.location}` : ""}
      </p>
    </li>
  );
}

function GroupEventItem({ event }: { event: AgendaGroupEvent }) {
  return (
    <li className="min-w-0 rounded-md bg-surface px-3 py-2 text-sm wrap-anywhere">
      <p className="font-medium text-text">
        {formatTime(event.startTime)} às {formatTime(event.endTime)}: {event.name}
      </p>
      <p className="text-text-muted">
        <Link href={`/professores/${event.professor.id}`} className={PERSON_LINK}>
          {event.professor.name}
        </Link>
        {event.location ? `, ${event.location}` : ""}
      </p>
      <p className="text-text-muted">
        {event.takenSpots} de {event.maxSpots} vagas preenchidas
      </p>
    </li>
  );
}

function SessionItem({ session, date }: { session: AgendaSession; date: string }) {
  return (
    <li className="flex min-w-0 gap-3 rounded-md bg-surface px-3 py-2 text-sm wrap-anywhere">
      {session.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada do S3 expira; next/image guardaria uma URL morta no otimizador.
        <img src={session.coverUrl} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
      ) : (
        <div aria-hidden="true" className="h-14 w-14 shrink-0 rounded bg-background" />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-medium text-text">
          {session.location}
          {session.startTime ? `, ${formatTime(session.startTime)}` : ""}
        </p>
        <p className="text-text-muted">
          Fotógrafo:{" "}
          <Link href={`/fotografos/${session.photographer.id}`} className={PERSON_LINK}>
            {session.photographer.name}
          </Link>
        </p>
        <p className="text-text-muted">
          {plural(session.photoCount, "foto", "fotos")},{" "}
          {plural(session.videoCount, "vídeo", "vídeos")}
        </p>
        <Link
          href={hrefWith("/midias", { dia: date, fotografo: session.photographer.id })}
          aria-label={`Ver mídias da sessão em ${session.location}`}
          className="inline-flex min-h-11 items-center self-start text-primary underline-offset-2 hover:underline lg:min-h-0"
        >
          Ver mídias
        </Link>
      </div>
    </li>
  );
}
