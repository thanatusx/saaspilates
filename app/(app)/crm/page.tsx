"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, HeaderButton } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { useDrawer } from "@/components/drawer/drawer-context";
import { LeadDrawerContent } from "@/components/crm/lead-drawer";
import { CRM_ORIGIN_LABEL, CRM_STAGES, CrmLead, CrmStage } from "@/lib/crm";
import { CRM_PERIOD_LABEL, CrmPeriodPreset, crmPeriodRange, inPeriod } from "@/lib/crm-period";
import { computeJourneyFunnel, JourneyFunnel } from "@/components/crm/journey-funnel";
import { StatusBadge } from "@/components/status";
import { StatusKey } from "@/lib/control-method";

function scoreClasses(score: number) {
  if (score >= 80) return "bg-(--ok-wash) text-(--ok)";
  if (score >= 60) return "bg-(--info-wash) text-(--info)";
  if (score >= 40) return "bg-(--warn-wash) text-(--warn)";
  return "bg-(--bad-wash) text-(--bad)";
}

function conversionStatus(pct: number): StatusKey {
  if (pct >= 25) return "excelente";
  if (pct >= 18) return "bom";
  if (pct >= 12) return "estavel";
  if (pct >= 8) return "atencao";
  return "critico";
}

// "YYYY-MM-DD" -> "dd/mm", como o protótipo mostra no card do lead.
function fmtDM(iso: string | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}`;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg bg-(--surface-3) p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
            value === opt.value ? "bg-(--surface) text-(--brand) shadow-sm" : "text-(--ink-3) hover:text-(--ink-2)"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LeadCard({
  lead,
  stage,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  lead: CrmLead;
  stage: CrmStage;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`cursor-grab rounded-lg border border-(--line) bg-(--surface) p-2.5 shadow-sm transition-[opacity,transform,border-color] duration-150 hover:-translate-y-px hover:border-(--brand) ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="font-display flex-1 truncate text-[13px] font-semibold text-(--ink)">{lead.name}</span>
        <span className={`font-display rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${scoreClasses(lead.leadScore)}`}>
          {lead.leadScore}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-2 text-[11px] text-(--ink-3)">
        <span>{CRM_ORIGIN_LABEL[lead.origin]}</span>
        <span>·</span>
        <span className="font-display">{fmtDM(lead.journey[stage] ?? lead.lastActivity.slice(0, 10))}</span>
      </div>
      {lead.obs ? <p className="mt-1.5 text-[11.5px] leading-snug text-(--ink-2)">{lead.obs}</p> : null}
    </div>
  );
}

const PERIOD_PRESETS: CrmPeriodPreset[] = ["hoje", "ontem", "semana", "quinzena", "mes", "anterior", "tudo", "custom"];

export default function CrmPage() {
  const { selectedStudio, crmLeads, moveLead } = useStudio();
  const { openDrawer } = useDrawer();
  const [dropTarget, setDropTarget] = useState<CrmStage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [preset, setPreset] = useState<CrmPeriodPreset>("mes");
  const [mode, setMode] = useState<"evento" | "coorte">("evento");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { since, until } = crmPeriodRange(preset, customFrom, customTo);
  const steps = computeJourneyFunnel(crmLeads, mode, since, until);
  const byStage = (stage: CrmStage) => steps.find((s) => s.stage === stage)?.n ?? 0;
  const entered = steps[0]?.n ?? 0;
  const scheduled = byStage("experimental_agendada");
  const attended = byStage("compareceu");
  const enrolled = byStage("matricula");
  const conversion = entered ? (enrolled / entered) * 100 : 0;

  const visibleLeads =
    mode === "coorte" && preset !== "tudo" ? crmLeads.filter((l) => inPeriod(l.journey.novo, since, until)) : crmLeads;

  return (
    <>
      <PageHeader
        title="CRM"
        subtitle={`Funil de leads de ${selectedStudio.name} — arraste os cards entre as colunas.`}
        actions={
          <HeaderButton onClick={() => openDrawer(<LeadDrawerContent />)}>
            <Plus size={14} strokeWidth={1.75} /> Novo lead
          </HeaderButton>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {/* Período + modo */}
        <div className="mb-5 rounded-xl border border-(--line) bg-(--surface) p-4 shadow-sm">
          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-65 flex-1">
              <p className="font-display mb-2 text-[10px] font-semibold tracking-widest text-(--ink-3) uppercase">
                Período
              </p>
              <SegmentedControl
                value={preset}
                onChange={setPreset}
                options={PERIOD_PRESETS.map((p) => ({ value: p, label: CRM_PERIOD_LABEL[p] }))}
              />
            </div>
            <div>
              <p className="font-display mb-2 text-[10px] font-semibold tracking-widest text-(--ink-3) uppercase">
                Contagem
              </p>
              <SegmentedControl
                value={mode}
                onChange={setMode}
                options={[
                  { value: "evento", label: "Por evento" },
                  { value: "coorte", label: "Por coorte" },
                ]}
              />
            </div>
          </div>
          {preset === "custom" ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-(--ink-3)">De</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-1.5 text-[13px] text-(--ink) outline-none focus:border-(--brand)"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-(--ink-3)">Até</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-1.5 text-[13px] text-(--ink) outline-none focus:border-(--brand)"
                />
              </label>
            </div>
          ) : null}
          <p className="mt-3 max-w-[80ch] text-[11.5px] leading-relaxed text-(--ink-3)">
            {preset === "tudo" ? "Mostrando a base inteira. " : `De ${fmtDM(since)} a ${fmtDM(until)}. `}
            {mode === "coorte" ? (
              <>
                <b className="text-(--ink-2)">Por coorte:</b> só os leads que entraram nesse período, seguidos até onde
                chegaram. É a conversão real.
              </>
            ) : (
              <>
                <b className="text-(--ink-2)">Por evento:</b> tudo que aconteceu no período, mesmo de lead que entrou
                antes. É a visão do dia a dia.
              </>
            )}
          </p>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-3">
          {[
            { name: "Leads que entraram", val: String(entered) },
            { name: "Experimentais agendadas", val: String(scheduled) },
            { name: "Compareceram", val: String(attended) },
            { name: "Matrículas", val: String(enrolled) },
          ].map((kpi) => (
            <div key={kpi.name} className="rounded-xl border border-(--line) bg-(--surface) p-3.5 shadow-sm">
              <p className="min-h-7.75 text-[11.5px] leading-snug text-(--ink-3)">{kpi.name}</p>
              <p className="font-display mt-1.5 mb-2 text-[23px] leading-none font-semibold tracking-tight text-(--ink)">
                {kpi.val}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-(--line) bg-(--surface) p-3.5 shadow-sm">
            <p className="min-h-7.75 text-[11.5px] leading-snug text-(--ink-3)">Conversão lead → matrícula</p>
            <p className="font-display mt-1.5 mb-2 text-[23px] leading-none font-semibold tracking-tight text-(--ink)">
              {conversion.toFixed(1)}%
            </p>
            <StatusBadge status={conversionStatus(conversion)} />
          </div>
        </div>

        {/* Funil da jornada */}
        <div className="mb-6 rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="font-display mb-4 text-sm font-semibold text-(--ink)">Jornada do lead</h2>
          <JourneyFunnel steps={steps} />
        </div>

        {/* Kanban */}
        <div className="overflow-x-auto pb-2.5">
          <div className="flex items-start gap-3" style={{ minWidth: "1100px" }}>
            {CRM_STAGES.map((stage) => {
              const leads = visibleLeads.filter((l) => l.stage === stage.key);
              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTarget(stage.key);
                  }}
                  onDragLeave={() => setDropTarget((t) => (t === stage.key ? null : t))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const leadId = e.dataTransfer.getData("text/plain");
                    if (leadId) moveLead(leadId, stage.key);
                    setDropTarget(null);
                  }}
                  className={`flex w-59 shrink-0 flex-col rounded-xl border bg-(--surface-2) transition-colors ${
                    dropTarget === stage.key ? "border-(--brand) bg-(--brand-wash)" : "border-(--line)"
                  }`}
                >
                  <div className="flex items-center gap-2 border-b border-(--line) px-3.5 py-2.5">
                    <span className="font-display text-[10.5px] font-semibold tracking-wide text-(--ink-2) uppercase">
                      {stage.label}
                    </span>
                    <span className="font-display ml-auto rounded-full border border-(--line) bg-(--surface) px-1.5 text-[11px] font-semibold text-(--ink-3)">
                      {leads.length}
                    </span>
                  </div>
                  <div className="flex min-h-14 flex-col gap-2 p-2.5">
                    {leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stage={stage.key}
                        dragging={draggingId === lead.id}
                        onOpen={() => openDrawer(<LeadDrawerContent lead={lead} />)}
                        onDragStart={() => setDraggingId(lead.id)}
                        onDragEnd={() => setDraggingId(null)}
                      />
                    ))}
                    {leads.length === 0 ? <div className="py-4 text-center text-[11px] text-(--ink-3)">—</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
