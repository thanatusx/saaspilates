import { AggregatedMetrics } from "@/lib/types";

export function WeeklyBarChart({ metrics, metaMensal }: { metrics: AggregatedMetrics; metaMensal: number }) {
  const weekly = metrics.weekly;
  const max = Math.max(...weekly.map((w) => w.matriculas), metaMensal / 4, 1);
  const pctMeta = metaMensal ? Math.round((metrics.matriculasRealizadas / metaMensal) * 100) : 0;

  return (
    <div className="flex flex-col rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-(--ink)">Novos alunos vs. meta</h3>
        <p className="text-xs text-(--ink-3)">
          {metrics.rangeLabel} · meta {metaMensal}/mês · {pctMeta}% do mês atingido até aqui
        </p>
      </div>
      <div className="flex flex-1 items-end justify-between gap-4 px-2">
        {weekly.length === 0 ? (
          <p className="text-sm text-(--ink-3)">Sem semanas lançadas neste intervalo ainda.</p>
        ) : (
          weekly.map((week) => (
            <div key={week.week} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-sm font-semibold text-(--ink-2)">{week.matriculas}</span>
              <div
                className="w-full max-w-10 rounded-t-sm bg-[#2a78d6] transition-[height,opacity] duration-500 ease-out hover:opacity-80"
                style={{ height: `${Math.max((week.matriculas / max) * 140, week.matriculas ? 12 : 2)}px` }}
                title={`${week.week}: ${week.matriculas} matrículas`}
              />
              <span className="text-[11px] font-medium text-(--ink-3)">{week.week}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
