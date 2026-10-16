"use client";

import { PageHeader } from "@/components/page-header";
import { StudioSwitcher } from "@/components/studio-switcher";
import { useStudio } from "@/components/studio-context";
import { StageTag } from "@/components/status";
import { InsightCard } from "@/components/insights/insight-card";
import {
  buildIndicatorInsights,
  computeCentralInsights,
  computePriorityIndicators,
  computeRatios,
  computeStageStatuses,
} from "@/lib/control-engine";
import { runDiagnosticEngine } from "@/lib/diagnostic-engine";
import { buildExecutiveSummary, buildOpportunities } from "@/lib/executive-summary";
import { SEASON_LABEL, yoyPeriodId } from "@/lib/seasonality";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ComparisonRow({
  label,
  current,
  previous,
  format = (v: number) => v.toFixed(0),
}: {
  label: string;
  current: number;
  previous?: number;
  format?: (v: number) => string;
}) {
  const delta = previous !== undefined && previous !== 0 ? ((current - previous) / previous) * 100 : undefined;
  return (
    <div className="flex items-center justify-between border-b border-(--line) py-2.5 text-[13px] last:border-0">
      <span className="text-(--ink-3)">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-(--ink)">{format(current)}</span>
        {previous !== undefined ? (
          <span className="text-(--ink-3)">
            vs. {format(previous)}
            {delta !== undefined ? (
              <span className={delta >= 0 ? "ml-1 text-(--ok)" : "ml-1 text-(--bad)"}>
                ({delta >= 0 ? "+" : ""}
                {delta.toFixed(1)}%)
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-(--ink-3)">sem período anterior</span>
        )}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { selectedStudio, currentMetrics, previousMetrics, season, selectedMonthId, getMonthMetrics } = useStudio();

  const stages = computeStageStatuses(selectedStudio, currentMetrics, previousMetrics, season);
  const indicators = computePriorityIndicators(selectedStudio, currentMetrics, previousMetrics, season);
  const ratios = computeRatios(selectedStudio, currentMetrics, previousMetrics);
  const { strengths, attentions } = computeCentralInsights(stages);
  const { findings, seasonalNote } = runDiagnosticEngine(ratios, indicators, stages, season);
  const opportunities = buildOpportunities(indicators);
  const summary = buildExecutiveSummary(selectedStudio.name, currentMetrics.rangeLabel, strengths, attentions, findings);

  const explainedLetters = new Set(findings.flatMap((f) => f.stageLetters));
  const fallbackCards = buildIndicatorInsights(indicators).filter(
    (card) => !card.stageLetters.some((l) => explainedLetters.has(l))
  );
  // Total de cartões em atenção mostrados mais abaixo (diagnóstico + fallback)
  // — não é o mesmo número de `attentions` (que conta etapas C.O.N.T.R.O.L,
  // no máximo 7). Um card grande precisa bater com o que aparece embaixo.
  const attentionItemsCount = findings.length + fallbackCards.length;

  const yoyMetrics = getMonthMetrics(yoyPeriodId(selectedMonthId));

  return (
    <>
      <PageHeader
        title="Insights do Studio"
        subtitle="Leitura estratégica automática — pontos fortes, pontos de atenção, oportunidades e a causa provável de cada problema."
        below={
          <div className="flex flex-wrap items-center gap-2">
            <StudioSwitcher />
            {season !== "normal" ? (
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  season === "vale" ? "bg-(--info-wash) text-(--info)" : "bg-(--warn-wash) text-(--warn)"
                }`}
              >
                {SEASON_LABEL[season]}
              </span>
            ) : null}
          </div>
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {/* Leitura executiva */}
        <section className="rounded-xl border border-(--brand)/25 bg-(--brand-wash) p-5">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-(--brand)">LEITURA EXECUTIVA DO MÊS</p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-4xl font-extrabold tabular-nums leading-none text-(--ok)">{strengths.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-(--ink-3)">
                ponto{strengths.length === 1 ? "" : "s"} forte{strengths.length === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="text-4xl font-extrabold tabular-nums leading-none text-(--bad)">{attentionItemsCount}</p>
              <p className="mt-1 text-[11px] font-semibold text-(--ink-3)">em atenção</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold tabular-nums leading-none text-(--info)">{opportunities.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-(--ink-3)">
                oportunidade{opportunities.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-(--ink)">{summary.text}</p>
          {summary.priorityStages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.priorityStages.map((s) => (
                <StageTag key={s.letter}>
                  PRIORIDADE: {s.name.toUpperCase()} ({s.display})
                </StageTag>
              ))}
            </div>
          ) : null}
        </section>

        {seasonalNote ? (
          <section className="rounded-xl border border-(--info)/25 bg-(--info-wash) p-4 text-[13px] text-(--ink-2)">
            <span className="mr-1.5 font-semibold text-(--brand)">Nota sazonal —</span>
            {seasonalNote}
          </section>
        ) : null}

        {/* Comparativo */}
        <section className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-(--ink)">Comparativo com o período anterior</h2>
          <p className="mb-3 text-xs text-(--ink-3)">
            {previousMetrics ? `vs. ${previousMetrics.rangeLabel}` : "sem período anterior disponível para este recorte"}
            {yoyMetrics ? ` · YoY disponível (${yoyMetrics.rangeLabel})` : " · sem 12 meses de histórico ainda para comparar YoY"}
          </p>
          <ComparisonRow label="Matrículas" current={currentMetrics.matriculasRealizadas} previous={previousMetrics?.matriculasRealizadas} />
          <ComparisonRow label="Receita" current={currentMetrics.receitaMensal} previous={previousMetrics?.receitaMensal} format={formatCurrency} />
          <ComparisonRow label="Taxa de ocupação" current={currentMetrics.ocupacaoPct} previous={previousMetrics?.ocupacaoPct} format={(v) => `${v.toFixed(0)}%`} />
          <ComparisonRow label="Churn" current={currentMetrics.churnPct} previous={previousMetrics?.churnPct} format={(v) => `${v.toFixed(1)}%`} />
          {yoyMetrics ? (
            <>
              <p className="mb-1 mt-4 text-[11px] font-semibold text-(--ink-3)">MESMO MÊS, ANO ANTERIOR (YoY)</p>
              <ComparisonRow label="Receita (YoY)" current={currentMetrics.receitaMensal} previous={yoyMetrics.receitaMensal} format={formatCurrency} />
            </>
          ) : null}
        </section>

        {/* Pontos fortes + Oportunidades */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-(--ink)">Pontos fortes</h2>
            {strengths.length === 0 ? (
              <p className="text-sm text-(--ink-3)">Nenhuma etapa em bom/excelente neste período.</p>
            ) : (
              <div className="stagger space-y-3">
                {strengths.map((s) => (
                  <InsightCard
                    key={s.letter}
                    type="strength"
                    title={`${s.name.toUpperCase()} (${s.display})`}
                    description={s.summary}
                    stageLetters={[s.letter]}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-(--ink)">Oportunidades</h2>
            {opportunities.length === 0 ? (
              <p className="text-sm text-(--ink-3)">Nada em &quot;Estável&quot; neste período — os indicadores já estão definidos entre bons e críticos.</p>
            ) : (
              <div className="stagger space-y-3">
                {opportunities.map((o) => (
                  <InsightCard
                    key={o.id}
                    type="opportunity"
                    title={o.title}
                    description={o.description}
                    stageLetters={o.stageLetters}
                    action={o.action}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 9.1 — Motor de diagnóstico */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-(--ink)">Diagnóstico do mês</h2>
          {findings.length === 0 ? (
            <p className="rounded-xl border border-(--line) bg-(--surface) p-5 text-sm text-(--ink-3) shadow-sm">
              Nenhuma combinação de causa-e-efeito detectada neste período para {selectedStudio.name}.
            </p>
          ) : (
            <div className="stagger space-y-4">
              {findings.map((f) => (
                <InsightCard
                  key={f.id}
                  type="attention"
                  title={f.title}
                  description={f.diagnosis}
                  stageLetters={f.stageLetters}
                  action={f.action}
                />
              ))}
            </div>
          )}
        </div>

        {/* Fallback: indicadores em atenção/crítico sem causa cruzada identificada */}
        {fallbackCards.length > 0 ? (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-(--ink)">Outros pontos de atenção</h2>
            <div className="stagger space-y-4">
              {fallbackCards.map((card) => (
                <InsightCard
                  key={card.id}
                  type="attention"
                  title={card.title}
                  description={card.diagnosis}
                  stageLetters={card.stageLetters}
                  action={card.recommendation}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
