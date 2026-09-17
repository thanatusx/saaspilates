import Link from "next/link";
import { ComputedIndicator, ComputedStage } from "@/lib/control-engine";
import { DiagnosticFinding } from "@/lib/diagnostic-engine";
import { DrawerHeader, DrawerBody } from "./drawer-shell";
import { StatusBadge, StatusMeter } from "@/components/status";
import { useDrawer } from "./drawer-context";

function adviceFor(stage: ComputedStage, findings: DiagnosticFinding[]): string {
  const related = findings.filter((f) => f.stageLetters.includes(stage.letter));
  if (related.length > 0) return related[0].action;
  if (stage.status === "atencao" || stage.status === "critico") {
    return `Deriva de: ${stage.derivedFrom}. Revise essa frente antes de investir em outra etapa.`;
  }
  return `Etapa saudável — ela sustenta o que essa etapa resolve: ${stage.derivedFrom}.`;
}

export function StageDrawerContent({
  stage,
  indicators,
  findings,
}: {
  stage: ComputedStage;
  indicators: ComputedIndicator[];
  findings: DiagnosticFinding[];
}) {
  const { closeDrawer } = useDrawer();
  const feeds = indicators.filter((ind) => ind.stages.includes(stage.letter));
  const related = findings.filter((f) => f.stageLetters.includes(stage.letter));

  return (
    <>
      <DrawerHeader eyebrow="ETAPA DO MÉTODO" title={`${stage.display} — ${stage.name}`}>
        <div className="mt-2">
          <StatusBadge status={stage.status} />
        </div>
      </DrawerHeader>
      <DrawerBody>
        <p className="text-[13px] leading-relaxed text-[var(--ink-3)]">{stage.phase} — {stage.derivedFrom}</p>

        <div className="rounded-xl bg-[var(--surface-2)] p-4">
          <p className="text-[10px] font-bold tracking-widest text-[var(--ink-3)]">LEITURA ATUAL</p>
          <p className="mt-1.5 text-[17px] font-semibold text-[var(--ink)]">{stage.summary}</p>
        </div>

        <div>
          <p className="mb-2.5 text-[10px] font-bold tracking-widest text-[var(--ink-3)]">O QUE ALIMENTA ESTA ETAPA</p>
          {feeds.length === 0 ? (
            <p className="text-[13px] text-[var(--ink-3)]">Nenhum indicador ligado diretamente a esta etapa.</p>
          ) : (
            <div className="space-y-2">
              {feeds.map((ind) => (
                <div
                  key={ind.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] px-3 py-2.5"
                >
                  <span className="flex-1 text-[13px] text-[var(--ink-2)]">{ind.label}</span>
                  <span className="text-[13px] font-semibold text-[var(--ink)]">{ind.value}</span>
                  {ind.base === "informativo" ? null : <StatusMeter status={ind.status} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border-l-[3px] p-4 ${
            stage.status === "atencao" || stage.status === "critico"
              ? "border-l-[var(--bad)] bg-[var(--bad-wash)]"
              : "border-l-[var(--ok)] bg-[var(--ok-wash)]"
          }`}
        >
          <p className="text-[13px] font-semibold text-[var(--ink)]">Leitura do método</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-2)]">{adviceFor(stage, findings)}</p>
        </div>

        {related.length > 0 ? (
          <div>
            <p className="mb-2.5 text-[10px] font-bold tracking-widest text-[var(--ink-3)]">DIAGNÓSTICOS LIGADOS</p>
            <div className="space-y-3">
              {related.map((f) => (
                <div key={f.id} className="rounded-lg border border-[var(--line)] p-3">
                  <p className="text-[13px] text-[var(--ink-2)]">{f.diagnosis}</p>
                  <p className="mt-2 text-[12.5px] font-medium text-[var(--brand)]">{f.action}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          href={`/indicadores#${stage.anchorId}`}
          onClick={closeDrawer}
          className="block rounded-lg bg-[var(--brand)] px-4 py-2.5 text-center text-[13px] font-semibold text-white transition-[opacity,background-color] duration-150 hover:opacity-90"
        >
          Ver todos os indicadores desta etapa →
        </Link>
      </DrawerBody>
    </>
  );
}
