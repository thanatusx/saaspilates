import { AggregatedMetrics } from "@/lib/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// Slots categóricos 1-4 da paleta, em ordem fixa — nunca trocados por linha.
const COST_ITEMS = (custos: AggregatedMetrics["custos"]) => [
  { label: "Folha", value: custos.folha, color: "#2a78d6" },
  { label: "Aluguel", value: custos.aluguel, color: "#eb6834" },
  { label: "Marketing", value: custos.marketing, color: "#1baf7a" },
  { label: "Outros", value: custos.outros, color: "#eda100" },
];

export function CostBreakdownChart({ metrics }: { metrics: AggregatedMetrics }) {
  const items = COST_ITEMS(metrics.custos).filter((i) => i.value > 0);
  const total = metrics.custosTotal;

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-(--ink)">Composição dos custos</h3>
        <span className="text-[13px] font-semibold text-(--ink-2)">{formatCurrency(total)}</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-(--ink-3)">Sem custos lançados neste intervalo ainda.</p>
      ) : (
        <>
          <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full">
            {items.map((item) => (
              <div
                key={item.label}
                style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
                title={`${item.label}: ${formatCurrency(item.value)} (${Math.round((item.value / total) * 100)}%)`}
                className="first:rounded-l-full last:rounded-r-full transition-[width] duration-500 ease-out"
              />
            ))}
          </div>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-(--ink-2)">{item.label}</span>
                <span className="font-semibold text-(--ink)">{formatCurrency(item.value)}</span>
                <span className="w-10 text-right text-(--ink-3)">{Math.round((item.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
