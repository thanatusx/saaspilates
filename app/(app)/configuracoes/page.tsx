"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { OPERATION_MODEL_LABEL, OperationModel, Studio } from "@/lib/types";
import { Select } from "@/components/ui/select";

const OPERATION_MODEL_OPTIONS = Object.keys(OPERATION_MODEL_LABEL) as OperationModel[];
const PLAN_OPTIONS: Studio["plan"][] = ["Plano Essencial", "Plano Pro", "Plano Enterprise"];

const OTHER_INTEGRATIONS: { name: string; desc: string; status: "em_construcao" | "nao_conectado" }[] = [
  { name: "Meta Ads", desc: "Puxar investimento, CPL e leads das campanhas.", status: "nao_conectado" },
  { name: "Google Ads", desc: "Custo por clique, CPL e conversões.", status: "nao_conectado" },
  { name: "Pixel + API de Conversão", desc: "Fecha a etapa N — rastreio de origem de 100% dos leads.", status: "nao_conectado" },
  { name: "IA de atendimento", desc: "Responder fora do horário e qualificar lead.", status: "em_construcao" },
];

interface WhatsAppConnection {
  display_phone_number: string | null;
  connected_at: string;
}

function WhatsAppConnectCard({ studioId }: { studioId: string }) {
  const [connection, setConnection] = useState<WhatsAppConnection | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStudioId, setLastStudioId] = useState(studioId);

  if (studioId !== lastStudioId) {
    setLastStudioId(studioId);
    setConnection(undefined);
  }

  useEffect(() => {
    fetch(`/api/whatsapp/connect?studioId=${studioId}`)
      .then((res) => res.json())
      .then((json) => setConnection(json.connection ?? null))
      .catch(() => setConnection(null));
  }, [studioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      setError("Phone Number ID e Access Token são obrigatórios.");
      return;
    }
    setError(null);
    setSaving(true);
    const res = await fetch("/api/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioId,
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim() || undefined,
        accessToken: accessToken.trim(),
        displayPhoneNumber: displayPhoneNumber.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Falha ao conectar.");
      return;
    }
    setConnection({ display_phone_number: displayPhoneNumber.trim() || null, connected_at: new Date().toISOString() });
    setShowForm(false);
    setAccessToken("");
  }

  return (
    <div className="rounded-xl border border-(--line) bg-(--surface) p-4 shadow-sm sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[13.5px] font-semibold text-(--ink)">WhatsApp Cloud API</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-(--ink-3)">Receber e responder mensagens direto no painel.</p>
        </div>
        {connection === undefined ? null : connection ? (
          <span className="inline-flex rounded-md bg-(--ok-wash) px-2 py-0.5 text-[11px] font-semibold text-(--ok)">
            Conectado{connection.display_phone_number ? ` — ${connection.display_phone_number}` : ""}
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-(--warn-wash) px-2 py-0.5 text-[11px] font-semibold text-(--warn)">
            Não conectado
          </span>
        )}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 text-[12.5px] font-medium text-(--brand) hover:underline"
        >
          {connection ? "Trocar credenciais" : "Conectar número"}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Phone Number ID *</span>
            <input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">WhatsApp Business Account ID</span>
            <input
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Número (exibição)</span>
            <input
              value={displayPhoneNumber}
              onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              placeholder="+55 11 91234-5678"
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Access Token (permanente) *</span>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          {error ? <p className="text-[12.5px] font-medium text-(--bad) sm:col-span-2">{error}</p> : null}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep) disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar conexão"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-[13px] font-medium text-(--ink-3) hover:text-(--ink-2)">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { selectedStudio, updateStudio, weeksOfSelectedMonth, role } = useStudio();
  const [form, setForm] = useState(selectedStudio);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateStudio({
      name: form.name,
      city: form.city,
      operationModel: form.operationModel,
      metaMatriculasMes: form.metaMatriculasMes,
      plan: form.plan,
    });
    setSavedMessage("Configurações salvas.");
    setTimeout(() => setSavedMessage(null), 2500);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ studio: selectedStudio, weeks: weeksOfSelectedMonth }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilates-pro-${selectedStudio.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle={`Dados do studio selecionado — ${selectedStudio.name}.`} />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <form onSubmit={handleSubmit} className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-(--ink)">Dados do studio</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Nome do studio</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Cidade</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Modelo de operação</span>
              <Select
                value={form.operationModel}
                onChange={(e) => setForm({ ...form, operationModel: e.target.value as OperationModel })}
              >
                {OPERATION_MODEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {OPERATION_MODEL_LABEL[opt]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Meta de matrículas/mês</span>
              <input
                type="number"
                min={1}
                value={form.metaMatriculasMes}
                onChange={(e) => setForm({ ...form, metaMatriculasMes: Number(e.target.value) })}
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Plano</span>
              <Select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Studio["plan"] })}>
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[opacity,background-color] duration-150 hover:opacity-90"
            >
              Salvar
            </button>
            {savedMessage ? <span className="text-[13px] font-medium text-(--ok)">{savedMessage}</span> : null}
          </div>
        </form>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-(--ink)">Integrações</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {role === "admin" ? <WhatsAppConnectCard studioId={selectedStudio.id} /> : null}
            {OTHER_INTEGRATIONS.map((ig) => (
              <div key={ig.name} className="rounded-xl border border-(--line) bg-(--surface) p-4 shadow-sm">
                <h3 className="text-[13.5px] font-semibold text-(--ink)">{ig.name}</h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-(--ink-3)">{ig.desc}</p>
                <span
                  className={`mt-3 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    ig.status === "em_construcao" ? "bg-(--info-wash) text-(--info)" : "bg-(--warn-wash) text-(--warn)"
                  }`}
                >
                  {ig.status === "em_construcao" ? "Em construção" : "Não conectado"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-(--ink)">Seus dados</h2>
          <p className="mb-4 max-w-[64ch] text-[12.5px] leading-relaxed text-(--ink-2)">
            Os dados deste studio ficam salvos na sua conta. Use exportar para guardar um snapshot em JSON.
          </p>
          <button
            type="button"
            onClick={exportData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--line-strong) bg-(--surface) px-4 py-2 text-sm font-medium text-(--ink-2) shadow-sm hover:border-(--brand) hover:text-(--brand)"
          >
            <Download size={15} strokeWidth={1.75} /> Exportar dados do mês (.json)
          </button>
        </div>
      </div>
    </>
  );
}
