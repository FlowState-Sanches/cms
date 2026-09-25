"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

/**
 * Menu recolhível abaixo de 1024 px (spec 5.1). É um `<details>` nativo:
 * abre e fecha por clique, Enter e Espaço mesmo sem JS, e o navegador
 * anuncia o estado expandido ou recolhido. Este Client Component só
 * acrescenta o que o `<details>` não faz sozinho: fechar ao navegar
 * (mudança de `pathname` ou clique num link do painel), com Esc
 * (devolvendo o foco ao botão "Menu") e ao clicar fora do painel.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    const details = detailsRef.current;
    if (event.key !== "Escape" || !details?.open) {
      return;
    }
    event.preventDefault();
    details.open = false;
    summaryRef.current?.focus();
  }

  function handlePanelClick(event: MouseEvent<HTMLDivElement>) {
    const details = detailsRef.current;
    if (details && event.target instanceof Element && event.target.closest("a[href]")) {
      details.open = false;
    }
  }

  return (
    <details ref={detailsRef} onKeyDown={handleKeyDown} className="lg:hidden">
      <summary
        ref={summaryRef}
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-border px-3 text-sm text-text hover:border-primary [&::-webkit-details-marker]:hidden"
      >
        Menu
      </summary>
      <div
        onClick={handlePanelClick}
        className="absolute inset-x-0 top-full z-40 flex max-h-[calc(100dvh-5rem)] flex-col gap-3 overflow-y-auto border-b border-border bg-background px-4 py-3 shadow-lg md:px-6"
      >
        {children}
      </div>
    </details>
  );
}
