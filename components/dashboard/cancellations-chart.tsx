import { AggregatedMetrics } from "@/lib/types";

// Cancelamentos por semana — visual propositalmente separado das matrículas
// (não é "menos matrículas", é uma métrica com leitura própria: churn).
export function CancellationsChart({ metrics }: { metrics: AggregatedMetrics }) {
  const weekly = metrics.weekly;
  const max = Math.max(...weekly.map((w) => w.cancelamentos), 1);

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-(--ink)">Cancelamentos</h3>
        <p className="text-xs text-(--ink-3)">
          {metrics.rangeLabel} · {metrics.cancelamentos} no total · churn {metrics.churnPct.toFixed(1)}%
        </p>
      </div>
      <div className="flex flex-1 items-end justify-between gap-4 px-2">
        {weekly.length === 0 ? (
          <p className="text-sm text-(--ink-3)">Sem semanas lançadas neste intervalo ainda.</p>
        ) : (
          weekly.map((week) => (
            <div key={week.week} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-sm font-semibold text-(--ink-2)">{week.cancelamentos}</span>
              <div
                className="w-full max-w-10 rounded-t-sm bg-[#e34948] transition-[height,opacity] duration-500 ease-out hover:opacity-80"
                style={{ height: `${Math.max((week.cancelamentos / max) * 140, week.cancelamentos ? 12 : 2)}px` }}
                title={`${week.week}: ${week.cancelamentos} cancelamentos`}
              />
              <span className="text-[11px] font-medium text-(--ink-3)">{week.week}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
