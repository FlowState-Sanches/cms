import Link from "next/link";
import { formatNumber } from "@/lib/admin-labels";

type StatCardProps = {
  label: string;
  value: number;
  detail?: string;
  /** Com href, o cartão inteiro é um link para a lista correspondente. */
  href?: string;
};

const CARD = "flex flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3";

/** Número de resumo do painel e dos detalhes. Server Component. */
export function StatCard({ label, value, detail, href }: StatCardProps) {
  const body = (
    <>
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <span className="font-display text-2xl font-semibold text-text">
        {formatNumber(value)}
      </span>
      {detail && <span className="text-xs text-text-muted">{detail}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${CARD} hover:border-primary`}>
        {body}
      </Link>
    );
  }
  return <div className={CARD}>{body}</div>;
}
