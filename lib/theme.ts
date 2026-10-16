export const THEME_STORAGE_KEY = "pilates-pro-theme";

export type Theme = "light" | "dark";

// Fonte única de verdade do tema: o atributo data-theme na <html>, que é o
// que app/globals.css usa para decidir as variáveis de cor — tanto para a
// escolha explícita do usuário quanto para o guard do
// `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`.
// Também espelha na classe .dark, usada pelo @custom-variant dark do Tailwind
// em qualquer utilitário dark: que ainda exista.
function setThemeAttributes(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Aplicação "crua", sem transição — usada só na primeira carga (ThemeInit),
// onde não faz sentido animar a partir de um estado que o usuário nunca viu.
export function applyTheme(theme: Theme) {
  setThemeAttributes(theme);
}

// Aplicação com transição — usada pelo clique no botão de tema. Em vez de
// depender de `transition` no CSS em cada elemento individualmente (frágil:
// qualquer utilitário Tailwind que defina transition-property em um elemento
// específico SUBSTITUI a lista inteira, então esse elemento troca de cor
// instantaneamente enquanto o resto da tela ainda está fazendo fade — foi
// exatamente o que causava a dessincronia), usamos a View Transitions API do
// navegador: ela tira um "print" da tela antes e depois da troca e faz um
// único crossfade da página inteira, sempre em sincronia perfeita. Sem
// suporte (ou com prefers-reduced-motion), cai para a troca instantânea.
export function applyThemeWithTransition(theme: Theme) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || typeof document.startViewTransition !== "function") {
    setThemeAttributes(theme);
    return;
  }

  // Congela toda transição CSS individual enquanto a View Transition roda —
  // ver o comentário de .theme-swap-freeze em app/globals.css.
  const root = document.documentElement;
  root.classList.add("theme-swap-freeze");
  const transition = document.startViewTransition(() => setThemeAttributes(theme));
  transition.finished.finally(() => root.classList.remove("theme-swap-freeze"));
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function resolveInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage indisponível (ex.: navegação privada).
  }
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}
