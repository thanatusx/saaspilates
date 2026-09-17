import { ComputedIndicator } from "@/lib/control-engine";
import { StatusMeter, StageTag } from "@/components/status";
import { STATUS_COLOR } from "@/lib/control-method";

// 3.2 — Indicadores prioritários: Resultado + Status + a letra C.O.N.T.R.O.L
// que ele mede. Indicadores "informativo" (receita, MRR) não têm semáforo
// próprio — mostram só o número e a tendência.
export function PriorityIndicators({ indicators }: { indicators: ComputedIndicator[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[0.16em] text-(--ink-3)">MÊS</span>
        <h2 className="text-sm font-semibold text-(--ink)">Indicadores prioritários</h2>
      </div>
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {indicators.map((ind) => (
          <div
            key={ind.id}
            className={`animate-rise flex flex-col justify-between rounded-xl border border-(--line) border-l-[3px] ${
              ind.base === "informativo" ? "border-l-(--line-strong)" : STATUS_COLOR[ind.status].border
            } bg-(--surface) p-4 shadow-sm transition-[box-shadow,background-color,border-color,color] duration-150 hover:shadow-md`}
            title={ind.reference}
          >
            <div>
              <p className="text-[13px] text-(--ink-3)">{ind.label}</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-(--ink)">{ind.value}</p>
              {ind.trend ? <p className="mt-0.5 text-[11px] text-(--ink-3)">{ind.trend}</p> : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              {ind.base === "informativo" ? (
                <span className="text-[11px] text-(--ink-3)">indicador informativo</span>
              ) : (
                <StatusMeter status={ind.status} />
              )}
              {ind.stageLabel ? <StageTag>{ind.stageLabel}</StageTag> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
