import { AggregatedMetrics } from "@/lib/types";
export function StudentGrowthChart({ metrics }: { metrics: AggregatedMetrics }) {
  const weekly = metrics.weekly;

  if (weekly.length < 2) {
    return (
      <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-(--ink)">Crescimento de alunos</h3>
          <p className="text-xs text-(--ink-3)">{metrics.rangeLabel}</p>
        </div>
        <p className="text-2xl font-bold text-(--ink)">{metrics.alunosAtivos}</p>
        <p className="text-xs text-(--ink-3)">alunos ativos — selecione um intervalo com mais semanas para ver a linha</p>
      </div>
    );
  }

  const values = weekly.map((w) => w.alunosAtivos);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padX = 4;
  const padY = 18;
  const points = values.map((v, i) => {
    const xPct = padX + (i / (values.length - 1)) * (100 - padX * 2);
    const yPct = padY + (100 - padY * 2) * (1 - (v - min) / range);
    return { xPct, yPct, v, week: weekly[i].week };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.xPct.toFixed(2)},${p.yPct.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].xPct.toFixed(2)},100 L${points[0].xPct.toFixed(2)},100 Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const deltaPct = first ? (((last - first) / first) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-(--ink)">Crescimento de alunos</h3>
          <p className="text-xs text-(--ink-3)">{metrics.rangeLabel}</p>
        </div>
        <span className={`text-[13px] font-semibold ${last >= first ? "text-(--ok)" : "text-(--bad)"}`}>
          {last >= first ? "+" : ""}
          {deltaPct}%
        </span>
      </div>

      <div className="relative h-32 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path d={areaPath} fill="#2a78d6" fillOpacity={0.08} stroke="none" />
          <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map((p, i) => (
          <div
            key={`${p.week}-${i}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-[#2a78d6] ring-2 ring-white" />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-(--brand-deep) px-1.5 py-0.5 text-[11px] font-medium text-white opacity-0 shadow-sm transition-[opacity,background-color] duration-150 group-hover:opacity-100">
              {p.week}: {p.v}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between px-1">
        {weekly.map((w, i) => (
          <span key={`${w.week}-${i}`} className="text-[11px] font-medium text-(--ink-3)">
            {w.week}
          </span>
        ))}
      </div>
    </div>
  );
}
