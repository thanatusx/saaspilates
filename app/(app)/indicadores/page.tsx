"use client";

import { PageHeader } from "@/components/page-header";
import { StudioSwitcher } from "@/components/studio-switcher";
import { useStudio } from "@/components/studio-context";
import { StatusMeter } from "@/components/status";
import {
  computePriorityIndicators,
  generalIndicators,
  groupIndicatorsByStage,
  resultIndicators,
} from "@/lib/control-engine";
import { CONTROL_STAGE_META, STATUS_COLOR } from "@/lib/control-method";

function IndicatorCard({
  indicator,
}: {
  indicator: ReturnType<typeof computePriorityIndicators>[number];
}) {
  const accent = indicator.base === "informativo" ? "border-l-(--line-strong)" : STATUS_COLOR[indicator.status].border;
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border border-(--line) border-l-[3px] ${accent} bg-(--surface) p-4 shadow-sm transition-[border-color,background-color,color] duration-150`}
    >
      <div>
        <p className="text-[13px] text-(--ink-3)">{indicator.label}</p>
        <p className="mt-1.5 text-xl font-bold tracking-tight text-(--ink)">{indicator.value}</p>
        {indicator.trend ? <p className="mt-0.5 text-[11px] text-(--ink-3)">{indicator.trend}</p> : null}
      </div>
      <div className="mt-3 space-y-1.5">
        {indicator.base === "informativo" ? (
          <span className="text-[11px] text-(--ink-3)">indicador informativo</span>
        ) : (
          <StatusMeter status={indicator.status} />
        )}
        <p className="text-[11px] text-(--ink-3)">
          Referência: {indicator.reference}
          {indicator.base === "calibrar" ? (
            <span className="ml-1.5 rounded bg-(--surface-3) px-1 py-0.5 font-medium text-(--ink-3)">
              calibrando
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export default function IndicadoresPage() {
  const { selectedStudio, currentMetrics, previousMetrics, season } = useStudio();
  const indicators = computePriorityIndicators(selectedStudio, currentMetrics, previousMetrics, season);
  const groups = groupIndicatorsByStage(indicators);
  const general = generalIndicators(indicators);
  const results = resultIndicators(indicators);

  return (
    <>
      <PageHeader
        title="Indicadores"
        subtitle="Todos os números do método, organizados pela etapa C.O.N.T.R.O.L que eles medem."
        below={<StudioSwitcher />}
      />
      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {results.length > 0 ? (
          <section className="rounded-xl border border-(--info)/30 bg-(--info-wash) p-5">
            <p className="mb-3 text-[11px] font-semibold text-(--brand)">
              INDICADOR-RESULTADO — não é causa isolada; sobe ou desce como consequência de C + T + O + L
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((indicator) => (
                <IndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          </section>
        ) : null}

        {groups.map((group) => {
          const meta = CONTROL_STAGE_META[group.letter];
          return (
            <section key={group.letter} id={meta.anchorId} className="scroll-mt-6">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand) text-sm font-bold text-white">
                  {meta.display}
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-(--ink)">{meta.name}</h2>
                  <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">{meta.key}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {group.indicators.map((indicator) => (
                  <IndicatorCard key={indicator.id} indicator={indicator} />
                ))}
              </div>
            </section>
          );
        })}

        {general.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-(--ink-3)">GERAIS</span>
              <h2 className="text-sm font-semibold text-(--ink)">Indicadores sem etapa fixa</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {general.map((indicator) => (
                <IndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
