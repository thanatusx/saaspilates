"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { computeRatios } from "@/lib/control-engine";
import { REFERENCE_RANGES } from "@/lib/reference-ranges";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

interface EventMap {
  id: string;
  stage: string;
  name: string;
  on: boolean;
  value: number;
  signal: string;
}

export default function TrafegoPage() {
  const { selectedStudio, currentMetrics, previousMetrics } = useStudio();
  const ratios = computeRatios(selectedStudio, currentMetrics, previousMetrics);
  const refs = REFERENCE_RANGES[selectedStudio.operationModel];

  const [adAccountId, setAdAccountId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [token, setToken] = useState("");
  const connected = Boolean(adAccountId && datasetId && token);

  const [events, setEvents] = useState<EventMap[]>([
    { id: "e1", stage: "Em contato", name: "Lead", on: true, value: 0, signal: "O lead respondeu e demonstrou interesse real." },
    { id: "e2", stage: "Aula agendada", name: "Schedule", on: true, value: 0, signal: "O lead confirmou data e horário da experimental." },
    { id: "e3", stage: "Compareceu", name: "ExperimentalRealizada", on: true, value: 0, signal: "Presença confirmada na aula experimental." },
    { id: "e4", stage: "Matrícula", name: "Purchase", on: true, value: Math.round(ratios.ticketMedio), signal: "O lead fechou plano." },
  ]);

  // Campanhas mock distribuídas a partir do investimento e leads realmente lançados.
  const campaigns = [
    { name: "Dor lombar | Raio 5 km", spend: currentMetrics.investimentoMidia * 0.45, leads: Math.round(currentMetrics.leads * 0.45), matriculas: Math.round(currentMetrics.matriculasRealizadas * 0.5) },
    { name: "Reformer | Condicionamento", spend: currentMetrics.investimentoMidia * 0.35, leads: Math.round(currentMetrics.leads * 0.35), matriculas: Math.round(currentMetrics.matriculasRealizadas * 0.35) },
    { name: "Remarketing | Visitantes 30d", spend: currentMetrics.investimentoMidia * 0.2, leads: Math.round(currentMetrics.leads * 0.2), matriculas: Math.max(currentMetrics.matriculasRealizadas - Math.round(currentMetrics.matriculasRealizadas * 0.85), 0) },
  ];
  const tSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const tLeads = campaigns.reduce((s, c) => s + c.leads, 0);

  return (
    <>
      <PageHeader title="Tráfego" subtitle={`Integração com Meta Ads — etapas T e N de ${selectedStudio.name}.`} />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="rounded-xl border-l-[3px] border-l-(--brand) border-y border-r border-(--line) bg-(--surface) p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">ETAPAS T — TRÁFEGO E N — NÚMEROS</p>
          <p className="mt-1.5 max-w-[74ch] text-[12.5px] leading-relaxed text-(--ink-2)">
            A Meta manda investimento e conversas iniciadas para dentro do sistema (alimenta T), e o sistema devolve o
            que aconteceu com cada lead depois da conversa (alimenta N e ensina o algoritmo a buscar matrícula, não
            conversa).
          </p>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-(--ink)">Conexão com a Meta</h2>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                connected ? "bg-(--ok-wash) text-(--ok)" : "bg-(--warn-wash) text-(--warn)"
              }`}
            >
              {connected ? "Conectado" : "Não conectado"}
            </span>
          </div>
          <p className="mb-4 text-[12px] text-(--ink-3)">
            Estrutura pronta, credenciais pendentes — nada aqui envia ou recebe dado real ainda.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Ad Account ID</span>
              <input
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
                placeholder="act_123456789012345"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Dataset / Pixel ID</span>
              <input
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                placeholder="123456789012345"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[13px] font-medium text-(--ink-2)">Access token</span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
              <span className="text-[11px] text-(--ink-3)">Em produção este campo não existe no front — o token fica no backend.</span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-(--ink)">Meta → plataforma</h2>
          <p className="mb-4 text-[12px] text-(--ink-3)">O que é puxado das campanhas.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-(--line) p-3">
              <p className="text-[11px] text-(--ink-3)">Investimento</p>
              <p className="mt-1 text-base font-bold text-(--ink)">{formatCurrency(tSpend)}</p>
            </div>
            <div className="rounded-lg border border-(--line) p-3">
              <p className="text-[11px] text-(--ink-3)">Conversas iniciadas</p>
              <p className="mt-1 text-base font-bold text-(--ink)">{tLeads}</p>
            </div>
            <div className="rounded-lg border border-(--line) p-3">
              <p className="text-[11px] text-(--ink-3)">CPL</p>
              <p className="mt-1 text-base font-bold text-(--ink)">{formatCurrency(tLeads ? tSpend / tLeads : 0)}</p>
              <p className="text-[10.5px] text-(--ink-3)">segmento: {formatCurrency(refs.cpl.min)}-{formatCurrency(refs.cpl.max)}</p>
            </div>
            <div className="rounded-lg border border-(--line) p-3">
              <p className="text-[11px] text-(--ink-3)">CAC</p>
              <p className="mt-1 text-base font-bold text-(--ink)">{ratios.cacMultiplo.toFixed(1)}x mensalidade</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-(--info-wash) p-3.5 text-[12.5px] text-(--ink-2)">
            <p className="mb-1 font-semibold text-(--info)">Reconciliação com o lançamento manual</p>
            {Math.abs(tSpend - currentMetrics.investimentoMidia) < 1 ? (
              <p>A Meta e o lançamento semanal batem: {formatCurrency(tSpend)} de investimento.</p>
            ) : (
              <p>
                A Meta reporta {formatCurrency(tSpend)}, o lançamento semanal tem {formatCurrency(currentMetrics.investimentoMidia)}.
                Diferença esperada quando o studio investe em outros canais.
              </p>
            )}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-(--line) text-[10.5px] font-semibold uppercase tracking-wide text-(--ink-3)">
                  <th className="py-2">Campanha</th>
                  <th className="py-2 text-right">Investimento</th>
                  <th className="py-2 text-right">Leads</th>
                  <th className="py-2 text-right">Matrículas</th>
                  <th className="py-2 text-right">CAC</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cac = c.matriculas ? c.spend / c.matriculas : 0;
                  return (
                    <tr key={c.name} className="border-b border-(--line) last:border-0">
                      <td className="py-2 text-(--ink)">{c.name}</td>
                      <td className="py-2 text-right">{formatCurrency(c.spend)}</td>
                      <td className="py-2 text-right">{c.leads}</td>
                      <td className="py-2 text-right">{c.matriculas}</td>
                      <td className="py-2 text-right">{c.matriculas ? formatCurrency(cac) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-(--ink)">Plataforma → Meta</h2>
          <p className="mb-4 text-[12px] text-(--ink-3)">Mapeamento de eventos devolvidos por conversão.</p>
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className={`rounded-lg border border-(--line) p-3.5 ${ev.on ? "" : "opacity-50"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-(--ink)">{ev.stage}</span>
                  <span className="text-(--ink-3)">→</span>
                  <span className="rounded-md bg-(--surface-3) px-2 py-0.5 text-[12px] font-medium text-(--ink-2)">{ev.name}</span>
                  <button
                    type="button"
                    onClick={() => setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, on: !e.on } : e)))}
                    className={`ml-auto relative h-5 w-9 rounded-full transition-colors ${ev.on ? "bg-(--brand)" : "bg-(--line-strong)"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        ev.on ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[12px] text-(--ink-3)">{ev.signal}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
