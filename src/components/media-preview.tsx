import type { MediaDetail } from "@/lib/api/admin-schemas";
import { MEDIA_TYPE_LABELS } from "@/lib/admin-labels";
import { formatDate } from "@/lib/labels";

type MediaPreviewProps = {
  media: Pick<MediaDetail, "type" | "url" | "thumbnailUrl" | "session">;
};

/**
 * Pré-visualização pela URL assinada de leitura (S3 privado). A página é
 * dinâmica (lê cookie), então a URL é renovada a cada visita.
 */
export function MediaPreview({ media }: MediaPreviewProps) {
  const description = `${MEDIA_TYPE_LABELS[media.type]} da sessão em ${media.session.location}, ${formatDate(media.session.sessionDate)}`;

  if (!media.url) {
    return (
      <p className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-border px-6 text-sm text-text-muted">
        Arquivo indisponível para pré-visualização.
      </p>
    );
  }

  if (media.type === "video") {
    return (
      <video
        controls
        preload="metadata"
        src={media.url}
        poster={media.thumbnailUrl ?? undefined}
        aria-label={description}
        className="max-h-[70vh] w-full rounded-md bg-black"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL assinada do S3 expira; next/image guardaria uma URL morta no otimizador.
    <img
      src={media.url}
      alt={description}
      className="max-h-[70vh] w-full rounded-md bg-black object-contain"
    />
  );
}
