import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

const href = (page: number) => `/alunos?pagina=${page}`;

describe("Pagination", () => {
  it("não renderiza com uma página só", () => {
    const { container } = render(<Pagination page={1} limit={20} total={20} buildHref={href} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("anterior, posição e próxima nessa ordem, com alvo de 44 px abaixo de 1024 px", () => {
    render(<Pagination page={2} limit={20} total={45} buildHref={href} />);
    const nav = screen.getByRole("navigation", { name: "Paginação" });
    expect(Array.from(nav.children).map((child) => child.textContent)).toEqual([
      "Anterior",
      "Página 2 de 3",
      "Próxima",
    ]);
    const prev = screen.getByRole("link", { name: "Anterior" });
    expect(prev).toHaveAttribute("href", "/alunos?pagina=1");
    expect(prev).toHaveClass("min-h-11", "min-w-11", "lg:min-h-0", "lg:min-w-0");
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/alunos?pagina=3",
    );
    expect(screen.getByText("Página 2 de 3")).toHaveClass(
      "whitespace-nowrap",
      "lg:order-first",
      "lg:mr-auto",
    );
  });

  it("na primeira página Anterior fica desabilitado, sem link", () => {
    render(<Pagination page={1} limit={20} total={45} buildHref={href} />);
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.getByText("Anterior")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Anterior")).toHaveClass("min-h-11");
  });
});
