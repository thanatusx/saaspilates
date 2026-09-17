"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextValue {
  mobileOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Controla o menu lateral em telas pequenas (abaixo de lg ele vira off-canvas
// com um botão de hambúrguer no cabeçalho). Em telas grandes o menu fica
// sempre visível e este estado não tem efeito.
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha o menu ao navegar — ajuste de estado durante a renderização (padrão
  // recomendado pelo React para "resetar estado quando uma prop muda"),
  // evitando o efeito colateral de um useEffect disparando outro render.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        toggleSidebar: () => setMobileOpen((v) => !v),
        closeSidebar: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar deve ser usado dentro de <SidebarProvider>");
  return ctx;
}
