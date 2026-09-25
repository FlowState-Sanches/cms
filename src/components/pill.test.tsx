import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonStatusBadge, PlanPill, VerificationPill } from "./pill";

describe("pills", () => {
  it("comunicam o estado em texto, não só em cor", () => {
    render(
      <>
        <PersonStatusBadge blocked />
        <PersonStatusBadge blocked={false} />
        <VerificationPill verified />
        <VerificationPill verified={false} />
        <PlanPill plan="paid" />
        <PlanPill plan="free" />
      </>,
    );
    for (const text of ["Bloqueado", "Ativo", "Verificado", "Pendente", "Pago", "Gratuito"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });
});
