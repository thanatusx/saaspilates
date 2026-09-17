"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface DrawerContextValue {
  openDrawer: (content: React.ReactNode) => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

// Drawer global (painel lateral direito) — usado para o detalhe de uma etapa
// C.O.N.T.R.O.L, edição de lead no CRM, etc. Só um por vez.
export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<React.ReactNode | null>(null);

  function openDrawer(c: React.ReactNode) {
    setContent(c);
  }
  function closeDrawer() {
    setContent(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isOpen = content !== null;

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}
      <div
        aria-hidden={!isOpen}
        onClick={closeDrawer}
        className={`fixed inset-0 z-[60] bg-[var(--brand-deep)]/40 transition-[opacity,background-color] duration-150 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 z-[61] w-full max-w-[440px] overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl transition-[transform,background-color,border-color] duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {content}
      </aside>
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer deve ser usado dentro de <DrawerProvider>");
  return ctx;
}
