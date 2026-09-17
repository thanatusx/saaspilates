import { AggregatedMetrics } from "@/lib/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function RevenueChart({ metrics }: { metrics: AggregatedMetrics }) {
  const weekly = metrics.weekly;
  const max = Math.max(...weekly.map((w) => w.receita), 1);

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-(--ink)">Receita</h3>
          <p className="text-xs text-(--ink-3)">
            {metrics.rangeLabel} · total: {formatCurrency(metrics.receitaMensal)}
          </p>
        </div>
      </div>
      {weekly.length === 0 ? (
        <p className="text-sm text-(--ink-3)">Sem semanas lançadas neste intervalo ainda.</p>
      ) : (
        <div className="space-y-3">
          {weekly.map((week) => (
            <div key={week.week} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-[11px] font-medium text-(--ink-3)">{week.week}</span>
              <div className="h-3 flex-1 rounded-sm bg-(--surface-3)">
                <div
                  className="h-full rounded-sm bg-[#2a78d6] transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max((week.receita / max) * 100, week.receita ? 10 : 1)}%` }}
                  title={`${week.week}: ${formatCurrency(week.receita)}`}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-[13px] font-semibold text-(--ink-2)">
                {formatCurrency(week.receita)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
