import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CmsLoading from "./loading";

describe("CmsLoading", () => {
  it("expõe status acessível de carregamento", () => {
    render(<CmsLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
