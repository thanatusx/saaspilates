"use client";

import { useEffect } from "react";
import { applyTheme, resolveInitialTheme } from "@/lib/theme";

// Aplica o tema salvo (ou a preferência do sistema) assim que o app monta no
// cliente. Não usamos um script bloqueante em <head>: nesta versão do
// Next.js o Script(beforeInteractive)/<head> manual dispara um bug de
// dev-mode (título e script duplicados no HTML de streaming). O custo é um
// possível flash muito breve na primeira carga — aceitável para esta
// ferramenta interna.
export function ThemeInit() {
  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, []);

  return null;
}
