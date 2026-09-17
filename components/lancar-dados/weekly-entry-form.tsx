"use client";

import { useState } from "react";
import { useStudio } from "@/components/studio-context";
import { monthLabel } from "@/lib/period";
import { ORIGIN_CHANNELS, WEEK_LABELS, WeekLabel, WeeklyEntry, emptyWeeklyEntry, sumOrigin } from "@/lib/types";
import { Select } from "@/components/ui/select";

function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-(--ink-2)">{label}</span>
      <input
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink-2) outline-none focus:border-(--brand)"
      />
      {hint ? <span className="text-[11px] text-(--ink-3)">{hint}</span> : null}
    </label>
  );
}

function SectionTitle({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="rounded bg-(--surface-3) px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-(--ink-3)">
        {tag}
      </span>
      <h3 className="text-[13px] font-semibold text-(--ink-2)">{children}</h3>
    </div>
  );
}

export function WeeklyEntryForm() {
  const {
    selectedStudio,
    selectedMonthId,
    setSelectedMonthId,
    months,
    selectedWeek,
    setSelectedWeek,
    weeksOfSelectedMonth,
    upsertWeeklyEntry,
  } = useStudio();

  const existing = weeksOfSelectedMonth.find((w) => w.week === selectedWeek);
  const formKey = `${selectedStudio.id}-${selectedMonthId}-${selectedWeek}`;
  const [loadedKey, setLoadedKey] = useState(formKey);
  const [entry, setEntry] = useState<WeeklyEntry>(() => existing ?? emptyWeeklyEntry(selectedMonthId, selectedWeek));
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Troca de studio/mês/semana → recarrega o formulário com o que já existe
  // (ou em branco, se a semana ainda não foi lançada). Ajuste de estado
  // durante a renderização (padrão recomendado pelo React), não em efeito.
  if (formKey !== loadedKey) {
    setLoadedKey(formKey);
    setEntry(existing ?? emptyWeeklyEntry(selectedMonthId, selectedWeek));
    setSavedMessage(null);
  }

  const origemSoma = sumOrigin(entry.origem);
  const origemDivergente = entry.matriculasNovas > 0 && origemSoma !== entry.matriculasNovas;
  const custosTotal = entry.custos.folha + entry.custos.aluguel + entry.custos.marketing + entry.custos.outros;

  function update<K extends keyof WeeklyEntry>(key: K, value: WeeklyEntry[K]) {
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    upsertWeeklyEntry(entry);
    setSavedMessage(`${selectedWeek} de ${monthLabel(selectedMonthId)} salva para ${selectedStudio.name}.`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <p className="mb-4 text-sm text-(--ink-3)">
          Preenchimento semanal, não diário. Escolha o mês e a semana (S01-S04) e lance os números daquela semana
          para <span className="font-semibold text-(--ink-2)">{selectedStudio.name}</span>. A
          meta de matrículas/mês não entra aqui — ela vem do cadastro do studio.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            <span className="text-(--ink-3)">Mês</span>
            <Select dense value={selectedMonthId} onChange={(e) => setSelectedMonthId(e.target.value)} className="min-w-36">
              {[...months].reverse().map((id) => (
                <option key={id} value={id}>
                  {monthLabel(id)}
                </option>
              ))}
              {months.length === 0 ? <option value={selectedMonthId}>{monthLabel(selectedMonthId)}</option> : null}
            </Select>
          </label>
          <div className="flex gap-1.5">
            {WEEK_LABELS.map((w) => {
              const filled = weeksOfSelectedMonth.some((week) => week.week === w);
              const active = w === selectedWeek;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeek(w as WeekLabel)}
                  className={`relative rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-(--brand) text-white"
                      : "bg-(--surface-3) text-(--ink-2) hover:bg-(--surface-3)"
                  }`}
                >
                  {w}
                  {filled ? (
                    <span
                      className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                        active ? "bg-(--surface)" : "bg-(--ok)"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <SectionTitle tag="FINANCEIRO">Receita e custos do período</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Receita do período" value={entry.receita} onChange={(v) => update("receita", v)} />
          <NumberField
            label="Custos — Folha"
            value={entry.custos.folha}
            onChange={(v) => update("custos", { ...entry.custos, folha: v })}
          />
          <NumberField
            label="Custos — Aluguel"
            value={entry.custos.aluguel}
            onChange={(v) => update("custos", { ...entry.custos, aluguel: v })}
          />
          <NumberField
            label="Custos — Marketing"
            value={entry.custos.marketing}
            onChange={(v) => update("custos", { ...entry.custos, marketing: v })}
          />
          <NumberField
            label="Custos — Outros"
            value={entry.custos.outros}
            onChange={(v) => update("custos", { ...entry.custos, outros: v })}
          />
          <NumberField
            label="Investimento em mídia/marketing"
            hint="etapas T/N"
            value={entry.investimentoMidia}
            onChange={(v) => update("investimentoMidia", v)}
          />
        </div>
        <p className="mt-3 text-[11px] text-(--ink-3)">Custos do período (soma): R$ {custosTotal.toLocaleString("pt-BR")}</p>
      </div>

      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <SectionTitle tag="ALUNOS">Movimentação de alunos e capacidade</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Alunos ativos no fim da semana"
            value={entry.alunosAtivosFim}
            onChange={(v) => update("alunosAtivosFim", v)}
          />
          <NumberField
            label="Alunos novos (matrículas)"
            value={entry.matriculasNovas}
            onChange={(v) => update("matriculasNovas", v)}
          />
          <NumberField label="Cancelamentos" value={entry.cancelamentos} onChange={(v) => update("cancelamentos", v)} />
          <NumberField
            label="Capacidade total de vagas na semana"
            hint="para a ocupação real"
            value={entry.capacidadeVagas}
            onChange={(v) => update("capacidadeVagas", v)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <SectionTitle tag="AQUISIÇÃO & ATENDIMENTO">Leads, experimentais e resposta</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Leads recebidos"
            hint="etapa T"
            value={entry.leadsRecebidos}
            onChange={(v) => update("leadsRecebidos", v)}
          />
          <NumberField
            label="Tempo médio de resposta ao 1º contato (min)"
            hint="etapa R"
            value={entry.tempoRespostaMedioMin}
            onChange={(v) => update("tempoRespostaMedioMin", v)}
          />
          <NumberField
            label="Experimentais agendadas"
            hint="etapa R"
            value={entry.experimentaisAgendadas}
            onChange={(v) => update("experimentaisAgendadas", v)}
          />
          <NumberField
            label="Experimentais realizadas (compareceram)"
            hint="etapas R/O"
            value={entry.experimentaisRealizadas}
            onChange={(v) => update("experimentaisRealizadas", v)}
          />
          <NumberField
            label="No-shows (agendou e não veio)"
            hint="etapa R"
            value={entry.noShows}
            onChange={(v) => update("noShows", v)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-(--line) bg-(--surface) p-5 shadow-sm">
        <SectionTitle tag="ETAPA N — OBRIGATÓRIO">Origem de cada aluno novo (canal)</SectionTitle>
        <p className="mb-4 text-[13px] text-(--ink-3)">
          Sem isso a letra N fica Crítica. A soma abaixo deve bater com &quot;Alunos novos (matrículas)&quot;.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ORIGIN_CHANNELS.map((channel) => (
            <NumberField
              key={channel}
              label={channel}
              value={entry.origem[channel] ?? 0}
              onChange={(v) => update("origem", { ...entry.origem, [channel]: v })}
            />
          ))}
        </div>
        <p className={`mt-3 text-[12px] font-medium ${origemDivergente ? "text-(--warn)" : "text-(--ink-3)"}`}>
          Soma lançada: {origemSoma} / {entry.matriculasNovas} alunos novos
          {origemDivergente ? " — confira antes de salvar, essa diferença vira \"Crítico\" na etapa N." : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep)"
        >
          Salvar {selectedWeek}
        </button>
        {savedMessage ? <span className="text-[13px] font-medium text-(--ok)">{savedMessage}</span> : null}
      </div>
    </form>
  );
}
