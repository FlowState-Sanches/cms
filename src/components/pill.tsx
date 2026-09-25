import type { ReactNode } from "react";
import type { StudentPlan } from "@/lib/api/admin-schemas";
import { PLAN_LABELS } from "@/lib/admin-labels";

const TONES = {
  neutral: "border-border bg-surface text-text-muted",
  primary: "border-primary/40 bg-primary-soft text-primary",
  accent: "border-accent/40 bg-accent-soft text-accent",
  danger: "border-danger/40 bg-danger-soft text-danger",
} as const;

export type PillTone = keyof typeof TONES;

/** Selo com rótulo em texto: a cor reforça, o texto comunica. */
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PersonStatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? <Pill tone="danger">Bloqueado</Pill> : <Pill tone="primary">Ativo</Pill>;
}

export function VerificationPill({ verified }: { verified: boolean }) {
  return verified ? (
    <Pill tone="primary">Verificado</Pill>
  ) : (
    <Pill tone="accent">Pendente</Pill>
  );
}

export function PlanPill({ plan }: { plan: StudentPlan }) {
  return <Pill tone={plan === "paid" ? "accent" : "neutral"}>{PLAN_LABELS[plan]}</Pill>;
}
