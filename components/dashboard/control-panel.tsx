"use client";

import { ComputedIndicator, ComputedStage } from "@/lib/control-engine";
import { DiagnosticFinding } from "@/lib/diagnostic-engine";
import { StatusMeter } from "@/components/status";
import { useDrawer } from "@/components/drawer/drawer-context";
import { StageDrawerContent } from "@/components/drawer/stage-drawer";

// 3.1 — Painel C.O.N.T.R.O.L: as 7 etapas como semáforos. O gestor bate o
// olho e sabe qual letra do método está doente, sem ler tabela nenhuma.
// Clicar abre o drawer lateral com o detalhe da etapa.
export function ControlPanel({
  stages,
  indicators,
  findings,
}: {
  stages: ComputedStage[];
  indicators: ComputedIndicator[];
  findings: DiagnosticFinding[];
}) {
  const { openDrawer } = useDrawer();

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-(--ink-3)">MÉTODO</span>
        <h2 className="text-sm font-semibold text-(--ink)">Painel C.O.N.T.R.O.L</h2>
        <span className="text-xs text-(--ink-3)">Clique em uma etapa para ver o que a alimenta</span>
      </div>
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {stages.map((stage) => (
          <button
            key={stage.letter}
            type="button"
            onClick={() => openDrawer(<StageDrawerContent stage={stage} indicators={indicators} findings={findings} />)}
            className="animate-rise group flex flex-col justify-between rounded-xl border border-(--line) bg-(--surface) p-4 text-left shadow-sm transition-[transform,box-shadow,background-color,border-color,color] duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            title={stage.derivedFrom}
          >
            <div>
              <p className="text-2xl font-bold leading-none text-(--ink) transition-colors group-hover:text-(--brand)">
                {stage.display}
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-widest text-(--ink-3)">{stage.key}</p>
              <p className="mt-2 text-[13px] font-medium leading-snug text-(--ink-2)">{stage.summary}</p>
            </div>
            <div className="mt-4">
              <StatusMeter status={stage.status} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
