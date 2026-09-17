import { AggregatedMetrics } from "@/lib/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function EfficiencyRow({ metrics }: { metrics: AggregatedMetrics }) {
  const cac = metrics.matriculasRealizadas ? metrics.investimentoMidia / metrics.matriculasRealizadas : 0;
  const tiles = [
    { label: "LTV", value: formatCurrency(metrics.ltv) },
    { label: "CAC", value: formatCurrency(cac) },
    { label: "Taxa de ocupação", value: `${metrics.ocupacaoPct.toFixed(0)}%` },
    {
      label: "ROI (LTV:CAC)",
      value: `${metrics.roiPct >= 0 ? "+" : ""}${metrics.roiPct.toFixed(0)}%`,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-(--ink-3)">EFICIÊNCIA</span>
        <h2 className="text-sm font-semibold text-(--ink)">LTV · CAC · Ocupação · ROI</h2>
      </div>
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="animate-rise rounded-xl border border-(--line) bg-(--surface) p-4 shadow-sm transition-[box-shadow,background-color,border-color,color] duration-150 hover:shadow-md"
          >
            <p className="text-[13px] text-(--ink-3)">{tile.label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-(--ink)">{tile.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
