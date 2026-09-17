import { CentralInsight } from "@/lib/control-engine";
import { StatusColorDot } from "@/components/status";

// 4. Insights da Central — leitura automática, sem o gestor precisar
// interpretar cada número: pontos fortes vs. pontos de atenção, sempre
// nomeando a letra C.O.N.T.R.O.L.
export function CentralInsights({
  strengths,
  attentions,
}: {
  strengths: CentralInsight[];
  attentions: CentralInsight[];
}) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-(--ink)">Pontos fortes</h3>
        {strengths.length === 0 ? (
          <p className="text-sm text-(--ink-3)">Nenhuma etapa em bom/excelente neste período.</p>
        ) : (
          <ul className="stagger space-y-3">
            {strengths.map((item) => (
              <li key={item.letter} className="animate-fade-in flex items-start gap-2.5">
                <StatusColorDot status={item.status} />
                <p className="text-[13px] text-(--ink-2)">
                  <span className="font-semibold text-(--ink)">
                    {item.name.toUpperCase()} ({item.display})
                  </span>{" "}
                  — {item.summary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-(--ink)">Pontos de atenção</h3>
        {attentions.length === 0 ? (
          <p className="text-sm text-(--ink-3)">Nenhuma etapa em atenção/crítico neste período.</p>
        ) : (
          <ul className="stagger space-y-3">
            {attentions.map((item) => (
              <li key={item.letter} className="animate-fade-in flex items-start gap-2.5">
                <StatusColorDot status={item.status} />
                <p className="text-[13px] text-(--ink-2)">
                  <span className="font-semibold text-(--ink)">
                    {item.name.toUpperCase()} ({item.display})
                  </span>{" "}
                  — {item.summary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
