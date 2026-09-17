"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { CRM_ORIGIN_LABEL, CRM_STAGES } from "@/lib/crm";
import { WaMessage, buildConversation } from "@/lib/whatsapp-mock";

export default function WhatsAppPage() {
  const { selectedStudio, crmLeads } = useStudio();
  const [selectedId, setSelectedId] = useState<string | null>(crmLeads[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [extraMessages, setExtraMessages] = useState<Record<string, WaMessage[]>>({});
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const selectedLead = crmLeads.find((l) => l.id === selectedId) ?? crmLeads[0];
  const stageLabel = selectedLead ? CRM_STAGES.find((s) => s.key === selectedLead.stage)?.label : "";
  const messages = selectedLead
    ? [...buildConversation(selectedLead), ...(extraMessages[selectedLead.id] ?? [])]
    : [];

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !selectedLead) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setExtraMessages((prev) => ({
      ...prev,
      [selectedLead.id]: [...(prev[selectedLead.id] ?? []), { from: "studio", text: draft.trim(), time }],
    }));
    setDraft("");
  }

  if (crmLeads.length === 0) {
    return (
      <>
        <PageHeader title="WhatsApp" subtitle={`Central de atendimento de ${selectedStudio.name}.`} />
        <div className="flex-1 p-8 text-sm text-(--ink-3)">Nenhum lead cadastrado no CRM ainda.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="WhatsApp" subtitle={`Central de atendimento de ${selectedStudio.name} — etapa R.`} />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-full shrink-0 flex-col overflow-y-auto border-r border-(--line) bg-(--surface) sm:w-72 lg:flex ${
            mobileView === "list" ? "flex" : "hidden"
          }`}
        >
          {crmLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => {
                setSelectedId(lead.id);
                setMobileView("chat");
              }}
              className={`flex items-start gap-2.5 border-b border-(--line) px-3.5 py-3 text-left transition-colors hover:bg-(--surface-2) ${
                selectedLead?.id === lead.id ? "bg-(--brand-wash)" : ""
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-wash) text-[13px] font-bold text-(--brand)">
                {lead.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-(--ink)">{lead.name}</span>
                <span className="block truncate text-[11.5px] text-(--ink-3)">
                  {CRM_ORIGIN_LABEL[lead.origin]} · {CRM_STAGES.find((s) => s.key === lead.stage)?.label}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div
          className={`min-w-0 flex-1 flex-col bg-(--surface-2) lg:flex ${
            mobileView === "chat" ? "flex" : "hidden"
          }`}
        >
          {selectedLead ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-(--line) bg-(--surface) px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  aria-label="Voltar"
                  className="-ml-1 rounded-lg p-1.5 text-(--ink-2) hover:bg-(--surface-2) lg:hidden"
                >
                  <ArrowLeft size={18} strokeWidth={1.75} />
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--brand-wash) text-[13px] font-bold text-(--brand)">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-(--ink)">{selectedLead.name}</p>
                  <p className="truncate text-[11.5px] text-(--ink-3)">
                    {selectedLead.phone} · {stageLabel}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "studio" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[74%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
                        m.from === "studio"
                          ? "rounded-br-sm bg-(--brand) text-white"
                          : "rounded-bl-sm border border-(--line) bg-(--surface) text-(--ink-2)"
                      }`}
                    >
                      {m.text}
                      <span className={`mt-1 block text-[9.5px] ${m.from === "studio" ? "text-white/70" : "text-(--ink-3)"}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-(--line) bg-(--surface) p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Mensagem"
                  className="flex-1 rounded-full border border-(--line-strong) bg-(--surface-2) px-4 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--brand) text-white transition-[opacity,background-color] duration-150 hover:opacity-90"
                  aria-label="Enviar"
                >
                  <Send size={16} strokeWidth={1.75} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-(--ink-3)">
              Selecione uma conversa
            </div>
          )}
        </div>

        <div className="hidden w-64 shrink-0 overflow-y-auto border-l border-(--line) bg-(--surface) p-4 lg:block">
          {selectedLead ? (
            <>
              <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">DADOS DO LEAD</p>
              <div className="mt-3 space-y-2.5">
                {[
                  ["Nome", selectedLead.name],
                  ["Telefone", selectedLead.phone],
                  ["Origem", CRM_ORIGIN_LABEL[selectedLead.origin]],
                  ["Etapa", stageLabel ?? ""],
                  ["Lead score", String(selectedLead.leadScore)],
                  ["Responsável", selectedLead.responsible],
                  ["Última atividade", selectedLead.lastActivity],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-(--line) pb-2">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-(--ink-3)">{k}</p>
                    <p className="mt-0.5 text-[12.5px] text-(--ink)">{v}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
