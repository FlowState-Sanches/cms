import Link from "next/link";
import type { MediaListItem, MediaStatus } from "@/lib/api/admin-schemas";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/admin-labels";
import { formatDate } from "@/lib/labels";
import { Pill, type PillTone } from "./pill";

export const MEDIA_STATUS_TONE: Record<MediaStatus, PillTone> = {
  ready: "primary",
  processing: "accent",
  pending: "neutral",
  failed: "danger",
};

function mediaLabel(item: MediaListItem): string {
  return `${MEDIA_TYPE_LABELS[item.type]} da sessão em ${item.session.location}, ${formatDate(item.session.sessionDate)}, ${MEDIA_STATUS_LABELS[item.status]}`;
}

/** Grade de mídias. Server Component; cada cartão leva ao detalhe. */
export function MediaGrid({ items }: { items: MediaListItem[] }) {
  return (
    <ul aria-label="Mídias" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <Link
            href={`/midias/${item.id}`}
            aria-label={mediaLabel(item)}
            className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface hover:border-primary"
          >
            {item.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do S3 expira; next/image guardaria uma URL morta no otimizador.
              <img src={item.thumbnailUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-background text-xs text-text-muted">
                Sem miniatura
              </div>
            )}
            <div className="flex flex-col gap-1 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text">{MEDIA_TYPE_LABELS[item.type]}</span>
                <Pill tone={MEDIA_STATUS_TONE[item.status]}>{MEDIA_STATUS_LABELS[item.status]}</Pill>
              </div>
              <span className="truncate text-text">{item.session.location}</span>
              <span className="text-text-muted">{formatDate(item.session.sessionDate)}</span>
              <span className="truncate text-text-muted">{item.photographer.name}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
