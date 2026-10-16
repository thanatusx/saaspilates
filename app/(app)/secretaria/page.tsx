"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { computeRatios } from "@/lib/control-engine";
import { StatusBadge } from "@/components/status";
import { Select } from "@/components/ui/select";
import { statusFromLevel } from "@/lib/control-method";

interface Cadence {
  id: string;
  on: boolean;
  n: number;
  unit: "min" | "h" | "d";
  label: string;
  msg: string;
}

const UNIT_LABEL: Record<Cadence["unit"], string> = { min: "minutos", h: "horas", d: "dias" };

function defaultCadences(studioName: string): Cadence[] {
  return [
    { id: "c1", on: true, n: 15, unit: "min", label: "Primeiro toque", msg: `Oi {{nome}}! Aqui é a secretária do ${studioName} 🙂 Me conta: o que te fez procurar Pilates agora?` },
    { id: "c2", on: true, n: 3, unit: "h", label: "Retomada no mesmo dia", msg: "Oi {{nome}}, tudo bem? É dor, condicionamento ou indicação médica?" },
    { id: "c3", on: true, n: 1, unit: "d", label: "Convite para a experimental", msg: "A aula experimental é gratuita e já inclui avaliação postural. Prefere manhã, tarde ou noite?" },
    { id: "c4", on: true, n: 4, unit: "d", label: "Quebra de objeção", msg: "Se o que pesou foi horário ou valor, me fala — tenho planos que encaixam na sua rotina." },
    { id: "c5", on: true, n: 7, unit: "d", label: "Última chamada da semana", msg: "Ainda tenho vaga na turma da manhã e da noite. Quer que eu segure um horário?" },
  ];
}

function fmtDelay(mins: number) {
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${(mins / 60).toFixed(mins % 60 ? 1 : 0)}h`;
  return `${(mins / 1440).toFixed(mins % 1440 ? 1 : 0)}d`;
}
function cadMinutes(c: Cadence) {
  return c.n * (c.unit === "min" ? 1 : c.unit === "h" ? 60 : 1440);
}

export default function SecretariaPage() {
  const { selectedStudio, currentMetrics, previousMetrics } = useStudio();
  const ratios = computeRatios(selectedStudio, currentMetrics, previousMetrics);

  const tempoStatus = statusFromLevel(ratios.tempoResposta <= 5 ? 5 : ratios.tempoResposta <= 15 ? 4 : ratios.tempoResposta <= 30 ? 3 : ratios.tempoResposta <= 60 ? 2 : 1);
  const noShowStatus = statusFromLevel(ratios.noShowPct <= 5 ? 5 : ratios.noShowPct <= 10 ? 4 : ratios.noShowPct <= 15 ? 3 : ratios.noShowPct <= 20 ? 2 : 1);

  const [active, setActive] = useState(true);
  const [name, setName] = useState("Marcela");
  const [cadences, setCadences] = useState<Cadence[]>(() => defaultCadences(selectedStudio.name));
  const [knowledge, setKnowledge] = useState([
    { id: "k1", name: "Planos_e_Precos_Studio.pdf", size: 38 },
    { id: "k2", name: "Quebra_de_Objecoes_Pilates.pdf", size: 86 },
    { id: "k3", name: "Contraindicacoes_e_Encaminhamento.pdf", size: 54 },
  ]);
  const [instructions, setInstructions] = useState({
    role: `Você é a ${name}, secretária do ${selectedStudio.name}. Sua função é receber e qualificar quem chega pelo WhatsApp, entender o objetivo com o Pilates e agendar a aula experimental.`,
    guardrails:
      "Nunca diga que é IA. Nunca dê orientação clínica, diagnóstico ou prescrição. Nunca prometa resultado ou cura. Nunca ofereça desconto fora da tabela de planos.",
    handoff:
      "Transfira para uma pessoa do studio quando: o lead pedir; após agendar a experimental; dúvida clínica; pedido de desconto; reclamação ou cancelamento.",
  });

  const cums = cadences.reduce<number[]>((acc, c) => {
    const prev = acc[acc.length - 1] ?? 0;
    acc.push(prev + cadMinutes(c));
    return acc;
  }, []);

  function updateCadence(id: string, patch: Partial<Cadence>) {
    setCadences((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function onKnowledgeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setKnowledge((prev) => [
      ...prev,
      ...files.map((f) => ({ id: `k${Date.now()}-${f.name}`, name: f.name, size: Math.max(1, Math.round(f.size / 1024)) })),
    ]);
    e.target.value = "";
  }

  return (
    <>
      <PageHeader title="Secretária Virtual" subtitle={`Configuração do atendimento automático de ${selectedStudio.name}.`} />
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="rounded-xl border-l-[3px] border-l-(--brand) border-y border-r border-(--line) bg-(--surface) p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[220px] flex-1">
              <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">ETAPA R — RESPOSTA</p>
              <p className="mt-1.5 max-w-[60ch] text-[12.5px] leading-relaxed text-(--ink-2)">
                A secretária virtual é a materialização da etapa R do método — garante resposta rápida e evita que o
                lead esfrie entre o primeiro contato e a aula experimental.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">TEMPO DE RESPOSTA</p>
              <p className="mt-1 text-lg font-bold text-(--ink)">{ratios.tempoResposta.toFixed(0)} min</p>
              <StatusBadge status={tempoStatus} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-(--ink-3)">NO-SHOW</p>
              <p className="mt-1 text-lg font-bold text-(--ink)">{ratios.noShowPct.toFixed(1)}%</p>
              <StatusBadge status={noShowStatus} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-(--ink)">Configuração geral</h2>
            <label className="flex items-center gap-2 text-[13px] text-(--ink-2)">
              {active ? "Ativa" : "Inativa"}
              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${active ? "bg-(--brand)" : "bg-(--line-strong)"}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    active ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
          <label className="flex max-w-xs flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Nome da secretária</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-(--ink)">Base de conhecimento</h2>
          <p className="mb-4 text-[12px] text-(--ink-3)">Documentos que a secretária consulta antes de responder.</p>
          <div className="mb-4 space-y-2">
            {knowledge.map((f) => (
              <div key={f.id} className="flex items-center gap-2.5 rounded-lg border border-(--line) bg-(--surface-2) px-3 py-2 text-[12.5px]">
                <span className="flex-1 truncate text-(--ink)">{f.name}</span>
                <span className="text-(--ink-3)">{f.size} KB</span>
                <button
                  type="button"
                  onClick={() => setKnowledge((prev) => prev.filter((k) => k.id !== f.id))}
                  className="text-(--bad) hover:opacity-70"
                  aria-label="Remover"
                >
                  <X size={15} strokeWidth={1.75} />
                </button>
              </div>
            ))}
            {knowledge.length === 0 ? <p className="text-[12px] text-(--ink-3)">Nenhum documento carregado.</p> : null}
          </div>
          <label className="block cursor-pointer rounded-lg border border-dashed border-(--line-strong) bg-(--surface-2) px-4 py-6 text-center text-[12.5px] text-(--ink-3) hover:border-(--brand) hover:text-(--brand)">
            Clique para carregar PDF, DOCX ou TXT
            <input type="file" multiple hidden onChange={onKnowledgeUpload} />
          </label>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-(--ink)">Cadência de follow-up</h2>
          <p className="mb-4 text-[12px] text-(--ink-3)">
            {cadences.filter((c) => c.on).length} de {cadences.length} ativas · alcance de{" "}
            {fmtDelay(cums[cums.length - 1] ?? 0)}
          </p>
          <div className="space-y-3">
            {cadences.map((c, i) => (
              <div key={c.id} className={`rounded-lg border border-(--line) p-3.5 ${c.on ? "" : "opacity-50"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--brand-wash) text-[12px] font-bold text-(--brand)">
                    {i + 1}
                  </span>
                  <input
                    value={c.label}
                    onChange={(e) => updateCadence(c.id, { label: e.target.value })}
                    className="flex-1 min-w-[140px] border-0 border-b border-transparent bg-transparent text-[13.5px] font-semibold text-(--ink) outline-none focus:border-(--brand)"
                  />
                  <button
                    type="button"
                    onClick={() => updateCadence(c.id, { on: !c.on })}
                    className={`relative h-5 w-9 rounded-full transition-colors ${c.on ? "bg-(--brand)" : "bg-(--line-strong)"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        c.on ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-(--ink-3)">
                  <span>Enviar</span>
                  <input
                    type="number"
                    min={1}
                    value={c.n}
                    onChange={(e) => updateCadence(c.id, { n: Math.max(1, Number(e.target.value)) })}
                    className="w-16 rounded-md border border-(--line-strong) bg-(--surface) px-2 py-1 text-right text-(--ink)"
                  />
                  <Select dense value={c.unit} onChange={(e) => updateCadence(c.id, { unit: e.target.value as Cadence["unit"] })}>
                    {(Object.keys(UNIT_LABEL) as Cadence["unit"][]).map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABEL[u]}
                      </option>
                    ))}
                  </Select>
                  <span>após {i === 0 ? "a entrada do lead" : "o toque anterior"}</span>
                  <span className="ml-auto rounded-full bg-(--surface-2) px-2.5 py-0.5">{fmtDelay(cums[i])} do início</span>
                </div>
                <textarea
                  rows={2}
                  value={c.msg}
                  onChange={(e) => updateCadence(c.id, { msg: e.target.value })}
                  className="w-full rounded-lg border border-(--line-strong) bg-(--surface-2) px-3 py-2 text-[12.5px] text-(--ink) outline-none focus:border-(--brand) focus:bg-(--surface)"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-(--ink)">Instruções</h2>
          <div className="space-y-4">
            {(
              [
                ["role", "Definição de função", "Quem é a secretária e qual o objetivo de cada conversa."],
                ["guardrails", "Prevenção de informações incorretas", "O que ela nunca pode dizer."],
                ["handoff", "Encaminhamento humano", "Quando ela para e passa para uma pessoa do studio."],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key}>
                <p className="mb-1 text-[13px] font-semibold text-(--ink)">{label}</p>
                <textarea
                  rows={3}
                  value={instructions[key]}
                  onChange={(e) => setInstructions({ ...instructions, [key]: e.target.value })}
                  className="w-full rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-[12.5px] leading-relaxed text-(--ink) outline-none focus:border-(--brand)"
                />
                <p className="mt-1 text-[11px] text-(--ink-3)">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
