"use client";

import { Sun } from "lucide-react";
import { applyThemeWithTransition, currentTheme, THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeToggle() {
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyThemeWithTransition(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage indisponível (ex.: navegação privada) — tema não persiste entre sessões.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className="group inline-flex items-center gap-1.5 rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--ink-2) shadow-sm transition-all duration-150 hover:bg-(--surface-2) hover:shadow active:scale-95"
    >
      <Sun size={14} strokeWidth={1.75} className="transition-transform duration-300 group-hover:rotate-45" />
      Tema
    </button>
  );
}
