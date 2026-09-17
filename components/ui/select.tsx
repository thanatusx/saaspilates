import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Select mais compacto, usado em barras de filtro (StudioSwitcher) em vez de formulários. */
  dense?: boolean;
}

// Select nativo com aparência própria: sem a seta padrão do navegador
// (appearance-none), com uma seta desenhada à mão bem espaçada da borda, borda
// visivelmente arredondada e foco consistentes com o resto do app. `dense`
// cobre os selects de barra de filtro (menores); o padrão cobre os selects de
// formulário. O menu nativo de opções (o popup que abre) é desenhado pelo
// sistema operacional/navegador — não é possível estilizar seus cantos por
// CSS de forma confiável entre navegadores, então o arredondamento fica no
// próprio campo, que é o que realmente compõe o layout da página.
export function Select({ dense = false, className = "", children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-(--line-strong) bg-(--surface) text-(--ink) outline-none transition-[border-color,box-shadow,background-color,color] duration-150 hover:border-(--ink-3) focus:border-(--brand) focus:ring-4 focus:ring-(--brand)/15 ${
          dense ? "py-1.5 pl-3 pr-8 text-[13px] font-medium" : "py-2.5 pl-3.5 pr-10 text-sm"
        } ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.75}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-(--ink-3) ${
          dense ? "right-2.5 h-3.5 w-3.5" : "right-3.5 h-4 w-4"
        }`}
      />
    </div>
  );
}
