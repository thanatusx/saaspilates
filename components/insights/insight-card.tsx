import { CONTROL_STAGE_META, ControlLetter } from "@/lib/control-method";

// Cartão de insight — mesmo padrão visual da seção de diagnóstico do
// protótipo de referência: borda fina ao redor + uma faixa colorida de 3px
// na esquerda (a cor identifica o tipo, sem precisar ler o texto), tags de
// etapa em pill na cor da marca, e uma caixa de "Ação recomendada" destacada
// do resto do texto.
export type InsightType = "strength" | "attention" | "opportunity";

const TYPE_ACCENT: Record<InsightType, string> = {
  strength: "border-l-(--ok)",
  attention: "border-l-(--bad)",
  opportunity: "border-l-(--info)",
};

export function InsightCard({
  type,
  title,
  description,
  stageLetters = [],
  action,
  className = "",
}: {
  type: InsightType;
  title: string;
  description: string;
  stageLetters?: ControlLetter[];
  action?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-(--line) border-l-[3px] ${TYPE_ACCENT[type]} bg-(--surface) p-4 shadow-sm transition-[border-color,background-color,color,box-shadow] duration-150 hover:shadow-md ${className}`}
    >
      <h4 className="text-[13.5px] font-semibold text-(--ink)">{title}</h4>
      <p className="mt-1 text-[12.5px] leading-relaxed text-(--ink-2)">{description}</p>
      {stageLetters.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {stageLetters.map((letter) => {
            const meta = CONTROL_STAGE_META[letter];
            return (
              <span
                key={letter}
                className="rounded-full bg-(--brand-wash) px-2 py-0.5 text-[10px] font-semibold tracking-wide text-(--brand)"
              >
                {meta.display} · {meta.name}
              </span>
            );
          })}
        </div>
      ) : null}
      {action ? (
        <div className="mt-2.5 rounded-md bg-(--surface-2) px-2.5 py-2 text-[12px] leading-relaxed text-(--ink-2)">
          <b className="font-semibold text-(--ink)">Ação recomendada:</b> {action}
        </div>
      ) : null}
    </div>
  );
}
