import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/api/admin-client";
import { isCurator } from "@/lib/api/cached";
import { orNotFound } from "@/lib/api/or-not-found";
import { entityIdSchema } from "@/lib/admin-action";
import {
  formatBytes,
  formatDuration,
  formatNumber,
  MEDIA_STATUS_LABELS,
  MEDIA_TYPE_LABELS,
  plural,
} from "@/lib/admin-labels";
import { formatDate } from "@/lib/labels";
import { ConfirmAction } from "@/components/confirm-action";
import { MEDIA_STATUS_TONE } from "@/components/media-grid";
import { MediaPreview } from "@/components/media-preview";
import { Pill } from "@/components/pill";
import { removeMediaAction } from "../actions";

export const metadata: Metadata = {
  title: "Mídia | FlowState CMS",
};

const DT = "text-text-muted";
const DD = "text-text";

export default async function MidiaPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurator())) {
    return null;
  }

  const { id } = await params;
  if (!entityIdSchema.safeParse(id).success) {
    notFound();
  }

  const media = await orNotFound(() => adminApi.mediaItem(id));
  const title = `${MEDIA_TYPE_LABELS[media.type]} da sessão em ${media.session.location}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/midias" className="text-sm text-text-muted hover:text-text">
          Voltar para mídias
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
          <Pill tone={MEDIA_STATUS_TONE[media.status]}>{MEDIA_STATUS_LABELS[media.status]}</Pill>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MediaPreview media={media} />

        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            <dt className={DT}>Sessão</dt>
            <dd className={DD}>
              {media.session.location}, {formatDate(media.session.sessionDate)}
            </dd>
            <dt className={DT}>Fotógrafo</dt>
            <dd className={DD}>
              <Link
                href={`/fotografos/${media.photographer.id}`}
                className="underline-offset-2 hover:underline"
              >
                {media.photographer.name}
              </Link>
            </dd>
            <dt className={DT}>Enviada em</dt>
            <dd className={DD}>{formatDate(media.createdAt)}</dd>
            <dt className={DT}>Formato</dt>
            <dd className={DD}>{media.mimeType}</dd>
            <dt className={DT}>Tamanho</dt>
            <dd className={DD}>{formatBytes(media.sizeBytes)}</dd>
            {media.width !== null && media.height !== null && (
              <>
                <dt className={DT}>Dimensões</dt>
                <dd className={DD}>{`${media.width} x ${media.height} px`}</dd>
              </>
            )}
            {media.durationSeconds !== null && (
              <>
                <dt className={DT}>Duração</dt>
                <dd className={DD}>{formatDuration(media.durationSeconds)}</dd>
              </>
            )}
            <dt className={DT}>Pedidos pagos</dt>
            <dd className={DD}>{formatNumber(media.paidOrders)}</dd>
          </dl>

          {media.paidOrders > 0 ? (
            <p
              role="note"
              className="rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-text"
            >
              {`Esta mídia tem ${plural(media.paidOrders, "pedido pago", "pedidos pagos")} e não pode ser removida.`}
            </p>
          ) : (
            <div>
              <ConfirmAction
                triggerLabel="Remover mídia"
                title="Remover mídia"
                description="O arquivo é apagado do armazenamento e sai do álbum da sessão. Essa ação não pode ser desfeita."
                confirmLabel="Confirmar remoção"
                action={removeMediaAction.bind(null, media.id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
