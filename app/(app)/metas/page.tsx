"use client";

import { PageHeader } from "@/components/page-header";
import { StudioSwitcher } from "@/components/studio-switcher";
import { useStudio } from "@/components/studio-context";
import { computeRatios } from "@/lib/control-engine";
import { REFERENCE_RANGES } from "@/lib/reference-ranges";
import { StatusKey } from "@/lib/control-method";
import { StatusBadge } from "@/components/status";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function statusForPct(pct: number): StatusKey {
  if (pct >= 110) return "excelente";
  if (pct >= 100) return "bom";
  if (pct >= 90) return "estavel";
  if (pct >= 75) return "atencao";
  return "critico";
}

interface GoalRow {
  key: string;
  label: string;
  target: number;
  current: number;
  format: (v: number) => string;
  unit: string;
}

export default function MetasPage() {
  const { selectedStudio, currentMetrics, previousMetrics, season } = useStudio();
  const ratios = computeRatios(selectedStudio, currentMetrics, previousMetrics);
  const refs = REFERENCE_RANGES[selectedStudio.operationModel];

  const metaLeadsImplicita = Math.round(selectedStudio.metaMatriculasMes / 0.28);
  const receitaAlvo = selectedStudio.metaMatriculasMes * (ratios.ticketMedio || (refs.ticketMedio.min + refs.ticketMedio.max) / 2);
  const ocupacaoAlvo = refs.ocupacaoIdeal.min;

  const rows: GoalRow[] = [
    {
      key: "matriculas",
      label: "Matrículas",
      target: selectedStudio.metaMatriculasMes,
      current: currentMetrics.matriculasRealizadas,
      format: (v) => String(Math.round(v)),
      unit: "matrículas",
    },
    {
      key: "receita",
      label: "Receita",
      target: receitaAlvo,
      current: currentMetrics.receitaMensal,
      format: formatCurrency,
      unit: "de receita",
    },
    {
      key: "leads",
      label: "Leads",
      target: metaLeadsImplicita,
      current: currentMetrics.leads,
      format: (v) => String(Math.round(v)),
      unit: "leads",
    },
    {
      key: "ocupacao",
      label: "Ocupação",
      target: ocupacaoAlvo,
      current: currentMetrics.ocupacaoPct,
      format: (v) => `${v.toFixed(0)}%`,
      unit: "de ocupação",
    },
  ];

  return (
    <>
      <PageHeader
        title="Metas"
        subtitle="Onde o studio precisa chegar neste período — a meta de matrículas vem do cadastro do studio (etapa C)."
        below={<StudioSwitcher />}
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {season !== "normal" ? (
          <p className="rounded-lg bg-(--info-wash) px-3 py-2 text-[12.5px] text-(--info)">
            Período de {season === "vale" ? "vale" : "pico"} — as metas de fluxo (matrículas, ocupação) usam régua
            sazonal na classificação do Painel C.O.N.T.R.O.L, mas os alvos abaixo mostram o número cheio.
          </p>
        ) : null}

        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((row) => {
            const pct = row.target > 0 ? (row.current / row.target) * 100 : 0;
            const status = statusForPct(pct);
            const falta = Math.max(0, row.target - row.current);
            return (
              <div
                key={row.key}
                className="animate-rise rounded-xl border border-(--line) bg-(--surface) p-4 shadow-sm transition-[box-shadow,background-color,border-color,color] duration-150 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-(--ink)">{row.label}</h3>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-(--ink)">{row.format(row.current)}</span>
                  <span className="text-xs text-(--ink-3)">/ {row.format(row.target)}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-(--surface-3)">
                  <div
                    className="h-full rounded-full bg-(--brand) transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
                  />
                </div>
                <p className="mt-2.5 text-[11.5px] text-(--ink-3)">
                  {falta > 0
                    ? `Faltam ${row.format(falta)} ${row.unit} para bater a meta.`
                    : `Meta batida — sobra de ${row.format(row.current - row.target)}.`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) shadow-sm">
          <div className="border-b border-(--line) px-5 py-3.5">
            <h2 className="text-sm font-semibold text-(--ink)">Semana a semana</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-(--line) text-[11px] font-semibold uppercase tracking-wide text-(--ink-3)">
                  <th className="px-5 py-2.5">Semana</th>
                  <th className="px-5 py-2.5 text-right">Matrículas</th>
                  <th className="px-5 py-2.5 text-right">Receita</th>
                  <th className="px-5 py-2.5 text-right">Cancelamentos</th>
                  <th className="px-5 py-2.5 text-right">Alunos ativos</th>
                </tr>
              </thead>
              <tbody>
                {currentMetrics.weekly.map((w) => (
                  <tr key={w.week} className="border-b border-(--line) last:border-0">
                    <td className="px-5 py-2.5 font-medium text-(--ink)">{w.week}</td>
                    <td className="px-5 py-2.5 text-right">{w.matriculas}</td>
                    <td className="px-5 py-2.5 text-right">{formatCurrency(w.receita)}</td>
                    <td className="px-5 py-2.5 text-right">{w.cancelamentos}</td>
                    <td className="px-5 py-2.5 text-right">{w.alunosAtivos}</td>
                  </tr>
                ))}
                {currentMetrics.weekly.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-(--ink-3)">
                      Sem semanas lançadas neste intervalo ainda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
