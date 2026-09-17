import { AggregatedMetrics } from "@/lib/types";

// Seção 5 — o funil mostra a taxa de passagem entre etapas E a letra
// responsável por cada uma, para revelar ONDE vaza.
const FUNNEL_ROWS: { label: string; letter: string; leakHint: string }[] = [
  { label: "Leads gerados", letter: "T", leakHint: "Poucos leads → ligar/escalar tráfego" },
  {
    label: "Lead → experimental agendada",
    letter: "R",
    leakHint: "Cai muito → atendimento lento no WhatsApp",
  },
  {
    label: "Agendada → compareceu",
    letter: "R",
    leakHint: "Cai muito → no-show, faltou régua de confirmação",
  },
  {
    label: "Compareceu → matrícula",
    letter: "O²",
    leakHint: "Cai muito → experimental não fecha, falta script",
  },
];

export function FunnelCard({ metrics }: { metrics: AggregatedMetrics }) {
  const values = [
    metrics.leads,
    metrics.experimentaisAgendadas,
    metrics.experimentaisRealizadas,
    metrics.matriculasViaExperimental,
  ];
  // Permanência: dos alunos que já estavam ativos + os que entraram, quantos ficaram.
  const baseAnterior = metrics.alunosAtivos + metrics.cancelamentos - metrics.matriculasRealizadas;
  const permanenciaPct = baseAnterior + metrics.matriculasRealizadas > 0
    ? (metrics.alunosAtivos / (baseAnterior + metrics.matriculasRealizadas)) * 100
    : 100;

  const rows = [
    ...FUNNEL_ROWS.map((row, i) => ({
      label: row.label,
      letter: row.letter,
      leakHint: row.leakHint,
      value: values[i],
      pctOfPrevious: i === 0 ? 100 : values[i - 1] ? Math.round((values[i] / values[i - 1]) * 100) : 0,
    })),
    {
      label: "Matrícula → permanência",
      letter: "L",
      value: metrics.alunosAtivos,
      pctOfPrevious: Math.round(permanenciaPct),
    },
  ];

  const max = Math.max(...rows.map((r) => r.value), 1);
  const fimAFim = metrics.leads ? Math.round((metrics.matriculasViaExperimental / metrics.leads) * 1000) / 10 : 0;

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-(--ink)">Funil de conversão</h3>
        <p className="text-xs text-(--ink-3)">{metrics.rangeLabel} · cada etapa mapeada à sua letra do método</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {rows.map((row) => {
          const widthPct = Math.max((row.value / max) * 100, 12);
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded bg-(--surface-3) text-[11px] font-bold text-(--ink-3)">
                {row.letter}
              </span>
              <span className="w-40 shrink-0 truncate text-[12.5px] text-(--ink-2)">
                {row.label}
              </span>
              
              <div className="h-7 flex-1 rounded-md bg-(--surface-3)">
                <div
                  className="flex h-full items-center rounded-md bg-(--brand) pl-3 text-[13px] font-semibold text-white transition-[width] duration-500 ease-out"
                  style={{ width: `${widthPct}%` }}
                >
                  {row.value}
                </div>
              </div>
              <span className="w-11 shrink-0 text-right text-[13px] font-semibold text-(--ink)">
                {row.pctOfPrevious}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-(--ink-3)">
        Percentual = conversão em relação à etapa anterior. Fim a fim:{" "}
        <span className="font-semibold text-(--ink-2)">{fimAFim}%</span> dos leads viram
        matrícula.
      </p>
    </div>
  );
}
