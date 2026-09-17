import { AggregatedMetrics } from "@/lib/types";

export function OriginCard({ metrics }: { metrics: AggregatedMetrics }) {
  const origin = metrics.origin;
  const total = origin.reduce((sum, o) => sum + o.value, 0);

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-(--ink)">Origem das matrículas</h3>
        <span className="text-[10px] font-bold tracking-widest text-(--ink-3)">ALIMENTA A ETAPA N</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-(--ink-3)">Sem matrículas com origem lançada neste período ainda.</p>
      ) : (
        <>
          <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full">
            {origin.map((o) => (
              <div
                key={o.label}
                style={{ width: `${(o.value / total) * 100}%`, backgroundColor: o.color }}
                title={`${o.label}: ${o.value} (${Math.round((o.value / total) * 100)}%)`}
                className="first:rounded-l-full last:rounded-r-full transition-[width] duration-500 ease-out"
              />
            ))}
          </div>
          <ul className="space-y-2.5">
            {origin.map((o) => (
              <li key={o.label} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                <span className="flex-1 text-(--ink-2)">{o.label}</span>
                <span className="font-semibold text-(--ink)">{o.value}</span>
                <span className="w-10 text-right text-(--ink-3)">{Math.round((o.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
