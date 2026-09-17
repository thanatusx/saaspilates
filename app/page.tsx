"use client";

import { Download, Upload, RotateCcw } from "lucide-react";
import { PageHeader, HeaderButton, ReadyBadge } from "@/components/page-header";
import { StudioSwitcher } from "@/components/studio-switcher";
import { useStudio } from "@/components/studio-context";
import { ControlPanel } from "@/components/dashboard/control-panel";
import { PriorityIndicators } from "@/components/dashboard/priority-indicators";
import { EfficiencyRow } from "@/components/dashboard/efficiency-row";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { WeeklyBarChart } from "@/components/dashboard/weekly-bar-chart";
import { StudentGrowthChart } from "@/components/dashboard/student-growth-chart";
import { CancellationsChart } from "@/components/dashboard/cancellations-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OriginCard } from "@/components/dashboard/origin-card";
import { CostBreakdownChart } from "@/components/dashboard/cost-breakdown-chart";
import { CentralInsights } from "@/components/dashboard/central-insights";
import {
  computeCentralInsights,
  computePriorityIndicators,
  computeRatios,
  computeStageStatuses,
} from "@/lib/control-engine";
import { runDiagnosticEngine } from "@/lib/diagnostic-engine";
import { SEASON_LABEL } from "@/lib/seasonality";

export default function CentralDePerformancePage() {
  const { selectedStudio, currentMetrics, previousMetrics, season } = useStudio();

  const stages = computeStageStatuses(selectedStudio, currentMetrics, previousMetrics, season);
  const indicators = computePriorityIndicators(selectedStudio, currentMetrics, previousMetrics, season);
  const ratios = computeRatios(selectedStudio, currentMetrics, previousMetrics);
  const { findings } = runDiagnosticEngine(ratios, indicators, stages, season);
  const { strengths, attentions } = computeCentralInsights(stages);

  return (
    <>
      <PageHeader
        title="Central de Performance"
        subtitle="Painel C.O.N.T.R.O.L — a saúde das 7 etapas do método, de um studio por vez."
        below={
          <div className="flex flex-wrap items-center gap-2">
            <StudioSwitcher />
            {season !== "normal" ? (
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  season === "vale"
                    ? "bg-(--info-wash) text-(--info)"
                    : "bg-(--warn-wash) text-(--warn)"
                }`}
                title="Indicadores de fluxo (matrículas, ocupação, crescimento) usam régua sazonal neste mês."
              >
                {SEASON_LABEL[season]}
              </span>
            ) : null}
          </div>
        }
        actions={
          <>
            <ReadyBadge />
            <HeaderButton>
              <Download size={14} strokeWidth={1.75} /> Exportar
            </HeaderButton>
            <HeaderButton>
              <Upload size={14} strokeWidth={1.75} /> Importar
            </HeaderButton>
            <HeaderButton>
              <RotateCcw size={14} strokeWidth={1.75} /> Demo
            </HeaderButton>
          </>
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <ControlPanel stages={stages} indicators={indicators} findings={findings} />
        <PriorityIndicators indicators={indicators} />
        <EfficiencyRow metrics={currentMetrics} />

        <FunnelCard metrics={currentMetrics} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StudentGrowthChart metrics={currentMetrics} />
          <WeeklyBarChart metrics={currentMetrics} metaMensal={selectedStudio.metaMatriculasMes} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueChart metrics={currentMetrics} />
          <CancellationsChart metrics={currentMetrics} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OriginCard metrics={currentMetrics} />
          <CostBreakdownChart metrics={currentMetrics} />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-(--ink-3)">LEITURA AUTOMÁTICA</span>
            <h2 className="text-sm font-semibold text-(--ink)">Insights da Central</h2>
          </div>
          <CentralInsights strengths={strengths} attentions={attentions} />
        </div>
      </div>
    </>
  );
}
