import { CRM_STAGES, CrmLead, CrmStage } from "@/lib/crm";
import { inPeriod } from "@/lib/crm-period";

// Funil da jornada — todas as etapas do CRM exceto "perdido" (é saída, não
// progresso). Dois modos de contagem:
// - evento: quantas vezes a etapa foi alcançada dentro do período, mesmo por
//   leads que entraram antes.
// - coorte: dos leads que ENTRARAM no período, quantos chegaram em cada
//   etapa (não importa quando) — a conversão real daquela leva.
export const FUNNEL_STAGES: CrmStage[] = CRM_STAGES.map((s) => s.key).filter((k) => k !== "perdido");

export interface FunnelStep {
  stage: CrmStage;
  label: string;
  n: number;
}

export function computeJourneyFunnel(
  leads: CrmLead[],
  mode: "evento" | "coorte",
  since: string,
  until: string
): FunnelStep[] {
  const cohort = mode === "coorte" ? leads.filter((l) => inPeriod(l.journey.novo, since, until)) : null;
  return FUNNEL_STAGES.map((stage) => {
    const label = CRM_STAGES.find((s) => s.key === stage)?.label ?? stage;
    const n = cohort
      ? cohort.filter((l) => Boolean(l.journey[stage])).length
      : leads.filter((l) => inPeriod(l.journey[stage], since, until)).length;
    return { stage, label, n };
  });
}

export function JourneyFunnel({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.n || 1;
  const max = Math.max(...steps.map((s) => s.n), 1);

  return (
    <div className="space-y-2.5">
      <div className="font-display grid grid-cols-[150px_minmax(0,1fr)_86px_78px] gap-3 pb-2 text-[9.5px] font-semibold tracking-widest text-(--ink-3) uppercase">
        <span>Etapa</span>
        <span></span>
        <span className="text-right">vs. anterior</span>
        <span className="text-right">vs. entrada</span>
      </div>
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].n : 0;
        const pctPrev = i === 0 ? 100 : prev > 0 ? (step.n / prev) * 100 : 0;
        const pctBase = base > 0 ? (step.n / base) * 100 : 0;
        const weak = i > 0 && prev > 0 && pctPrev < 50;
        return (
          <div key={step.stage} className="grid grid-cols-[150px_minmax(0,1fr)_86px_78px] items-center gap-3">
            <span className="truncate text-[12.5px] text-(--ink-2)">{step.label}</span>
            <div className="relative h-8 overflow-hidden rounded-md bg-(--surface-3)">
              <div
                className="flex h-full items-center rounded-md bg-(--brand) pl-3 text-[13px] font-bold text-white transition-[width] duration-300"
                style={{ width: `${Math.max((step.n / max) * 100, step.n ? 5 : 0)}%` }}
              >
                {step.n}
              </div>
            </div>
            <span
              className={`font-display text-right text-[12.5px] font-semibold tabular-nums ${weak ? "text-(--bad)" : "text-(--ink-2)"}`}
            >
              {i === 0 ? "—" : `${pctPrev.toFixed(0)}%`}
            </span>
            <span className="font-display text-right text-[12.5px] font-semibold tabular-nums text-(--ink-3)">
              {pctBase.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
