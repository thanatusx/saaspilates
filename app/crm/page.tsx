"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, HeaderButton } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { useDrawer } from "@/components/drawer/drawer-context";
import { LeadDrawerContent } from "@/components/crm/lead-drawer";
import { CRM_ORIGIN_LABEL, CRM_STAGES, CrmLead, CrmStage } from "@/lib/crm";

function scoreClasses(score: number) {
  if (score >= 80) return "bg-(--ok-wash) text-(--ok)";
  if (score >= 60) return "bg-(--info-wash) text-(--info)";
  if (score >= 40) return "bg-(--warn-wash) text-(--warn)";
  return "bg-(--bad-wash) text-(--bad)";
}

function LeadCard({ lead, onOpen }: { lead: CrmLead; onOpen: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      className="cursor-grab rounded-lg border border-(--line) bg-(--surface) p-2.5 shadow-sm transition-colors hover:border-(--brand)"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="flex-1 truncate text-[13px] font-semibold text-(--ink)">{lead.name}</span>
        <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${scoreClasses(lead.leadScore)}`}>
          {lead.leadScore}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-2 text-[11px] text-(--ink-3)">
        <span>{CRM_ORIGIN_LABEL[lead.origin]}</span>
        <span>·</span>
        <span>{lead.responsible}</span>
      </div>
      {lead.obs ? <p className="mt-1.5 text-[11.5px] leading-snug text-(--ink-2)">{lead.obs}</p> : null}
    </div>
  );
}

export default function CrmPage() {
  const { selectedStudio, crmLeads, moveLead } = useStudio();
  const { openDrawer } = useDrawer();
  const [dropTarget, setDropTarget] = useState<CrmStage | null>(null);

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
      <div className="flex-1 overflow-x-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex items-start gap-3" style={{ minWidth: "1100px" }}>
          {CRM_STAGES.map((stage) => {
            const leads = crmLeads.filter((l) => l.stage === stage.key);
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
                className={`flex w-[220px] shrink-0 flex-col rounded-xl border bg-(--surface-2) transition-colors ${
                  dropTarget === stage.key ? "border-(--brand) bg-(--brand-wash)" : "border-(--line)"
                }`}
              >
                <div className="flex items-center gap-2 border-b border-(--line) px-3 py-2.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-(--ink-2)">
                    {stage.label}
                  </span>
                  <span className="ml-auto rounded-full border border-(--line) bg-(--surface) px-1.5 text-[11px] font-semibold text-(--ink-3)">
                    {leads.length}
                  </span>
                </div>
                <div className="flex min-h-[80px] flex-col gap-2 p-2">
                  {leads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onOpen={() => openDrawer(<LeadDrawerContent lead={lead} />)} />
                  ))}
                  {leads.length === 0 ? <div className="py-4 text-center text-[11px] text-(--ink-3)">—</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
