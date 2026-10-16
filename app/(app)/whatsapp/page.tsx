"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { CRM_ORIGIN_LABEL, CRM_STAGES } from "@/lib/crm";
import { createClient } from "@/lib/supabase/client";

interface WaMessageRow {
  id: string;
  lead_id: string | null;
  direction: "inbound" | "outbound";
  from_phone: string;
  to_phone: string;
  body: string;
  status: string;
  wa_timestamp: string;
}

interface Thread {
  key: string; // lead_id, ou o telefone quando ainda não bate com nenhum lead do CRM
  leadId: string | null;
  phone: string;
  lastMessage: WaMessageRow;
}

function contactPhoneOf(m: WaMessageRow): string {
  return m.direction === "inbound" ? m.from_phone : m.to_phone;
}
function threadKeyOf(m: WaMessageRow): string {
  return m.lead_id ?? contactPhoneOf(m);
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function WhatsAppPage() {
  const { selectedStudio, selectedStudioId, crmLeads } = useStudio();
  const [supabase] = useState(() => createClient());
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Lista de conversas — carrega tudo (só os campos leves) e reduz pra 1
  // linha por contato, ficando com a mensagem mais recente de cada.
  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("id, lead_id, direction, from_phone, to_phone, body, status, wa_timestamp")
        .eq("studio_id", selectedStudioId)
        .order("wa_timestamp", { ascending: false });
      if (cancelled) return;
      const rows = (data ?? []) as WaMessageRow[];
      const byKey = new Map<string, Thread>();
      for (const row of rows) {
        const key = threadKeyOf(row);
        if (!byKey.has(key)) {
          byKey.set(key, { key, leadId: row.lead_id, phone: contactPhoneOf(row), lastMessage: row });
        }
      }
      const nextThreads = [...byKey.values()];
      setThreads(nextThreads);
      setSelectedKey((prev) => (prev && byKey.has(prev) ? prev : (nextThreads[0]?.key ?? null)));
    }
    loadThreads();
    return () => {
      cancelled = true;
    };
  }, [supabase, selectedStudioId]);

  // Mensagens da conversa selecionada — sob demanda, não é pré-carregado com
  // o resto dos dados do studio (histórico pode crescer sem limite).
  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!selectedKey) {
        setMessages([]);
        return;
      }
      const thread = threads.find((t) => t.key === selectedKey);
      let query = supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("studio_id", selectedStudioId)
        .order("wa_timestamp", { ascending: true });
      query = thread?.leadId
        ? query.eq("lead_id", thread.leadId)
        : query.is("lead_id", null).or(`from_phone.eq.${selectedKey},to_phone.eq.${selectedKey}`);
      const { data } = await query;
      if (!cancelled) setMessages((data ?? []) as WaMessageRow[]);
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, selectedStudioId, selectedKey]);

  // Realtime — mensagens novas (chegando pelo webhook, ou confirmadas pelo
  // envio) aparecem sem precisar dar refresh.
  useEffect(() => {
    const channel = supabase
      .channel(`whatsapp-${selectedStudioId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `studio_id=eq.${selectedStudioId}` },
        (payload) => {
          const row = payload.new as WaMessageRow;
          const key = threadKeyOf(row);
          setThreads((prev) => {
            const others = prev.filter((t) => t.key !== key);
            return [{ key, leadId: row.lead_id, phone: contactPhoneOf(row), lastMessage: row }, ...others];
          });
          setSelectedKey((current) => {
            if (current === key) {
              setMessages((prevMsgs) => (prevMsgs.some((m) => m.id === row.id) ? prevMsgs : [...prevMsgs, row]));
            }
            return current;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedStudioId]);

  const leadByPhoneOrId = useMemo(() => {
    const map = new Map<string, (typeof crmLeads)[number]>();
    for (const lead of crmLeads) map.set(lead.id, lead);
    return map;
  }, [crmLeads]);

  const selectedThread = threads.find((t) => t.key === selectedKey);
  const selectedLead = selectedThread?.leadId ? leadByPhoneOrId.get(selectedThread.leadId) : undefined;
  const stageLabel = selectedLead ? CRM_STAGES.find((s) => s.key === selectedLead.stage)?.label : undefined;

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !selectedThread) return;
    setSending(true);
    setSendError(null);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioId: selectedStudioId,
        leadId: selectedThread.leadId,
        to: selectedThread.phone,
        body: draft.trim(),
      }),
    });
    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setSendError(json?.error ?? "Falha ao enviar mensagem.");
      return;
    }
    setDraft("");
  }

  if (threads.length === 0) {
    return (
      <>
        <PageHeader title="WhatsApp" subtitle={`Central de atendimento de ${selectedStudio.name}.`} />
        <div className="flex-1 p-8 text-sm text-(--ink-3)">
          Nenhuma conversa ainda. Configure o número do studio em Configurações e as mensagens recebidas aparecem
          aqui automaticamente.
        </div>
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
          {threads.map((thread) => {
            const lead = thread.leadId ? leadByPhoneOrId.get(thread.leadId) : undefined;
            const name = lead?.name ?? thread.phone;
            return (
              <button
                key={thread.key}
                type="button"
                onClick={() => {
                  setSelectedKey(thread.key);
                  setMobileView("chat");
                }}
                className={`flex items-start gap-2.5 border-b border-(--line) px-3.5 py-3 text-left transition-colors hover:bg-(--surface-2) ${
                  selectedKey === thread.key ? "bg-(--brand-wash)" : ""
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-wash) text-[13px] font-bold text-(--brand)">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-(--ink)">{name}</span>
                  <span className="block truncate text-[11.5px] text-(--ink-3)">
                    {lead ? `${CRM_ORIGIN_LABEL[lead.origin]} · ${CRM_STAGES.find((s) => s.key === lead.stage)?.label}` : "Não identificado no CRM"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={`min-w-0 flex-1 flex-col bg-(--surface-2) lg:flex ${mobileView === "chat" ? "flex" : "hidden"}`}>
          {selectedThread ? (
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
                  {(selectedLead?.name ?? selectedThread.phone).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-(--ink)">
                    {selectedLead?.name ?? selectedThread.phone}
                  </p>
                  <p className="truncate text-[11.5px] text-(--ink-3)">
                    {selectedThread.phone}
                    {stageLabel ? ` · ${stageLabel}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[74%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
                        m.direction === "outbound"
                          ? "rounded-br-sm bg-(--brand) text-white"
                          : "rounded-bl-sm border border-(--line) bg-(--surface) text-(--ink-2)"
                      }`}
                    >
                      {m.body}
                      <span className={`mt-1 block text-[9.5px] ${m.direction === "outbound" ? "text-white/70" : "text-(--ink-3)"}`}>
                        {formatTime(m.wa_timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex flex-col gap-2 border-t border-(--line) bg-(--surface) p-3">
                {sendError ? <p className="rounded-lg bg-(--bad-wash) px-3 py-1.5 text-[12px] text-(--bad)">{sendError}</p> : null}
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Mensagem"
                    disabled={sending}
                    className="flex-1 rounded-full border border-(--line-strong) bg-(--surface-2) px-4 py-2 text-sm text-(--ink) outline-none focus:border-(--brand) disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--brand) text-white transition-[opacity,background-color] duration-150 hover:opacity-90 disabled:opacity-60"
                    aria-label="Enviar"
                  >
                    <Send size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-(--ink-3)">Selecione uma conversa</div>
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
          ) : selectedThread ? (
            <p className="text-[12.5px] text-(--ink-3)">
              Este número ({selectedThread.phone}) ainda não corresponde a nenhum lead cadastrado no CRM.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
