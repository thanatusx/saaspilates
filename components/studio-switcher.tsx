"use client";

import { useStudio } from "@/components/studio-context";
import { GRANULARITY_LABEL, Granularity, QUINZENAS, monthLabel } from "@/lib/period";
import { WEEK_LABELS, WeekLabel } from "@/lib/types";
import { Select } from "@/components/ui/select";

const GRANULARITY_OPTIONS: Granularity[] = ["semana", "quinzena", "mes", "historico"];

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-(--ink-3)">{label}</span>
      <Select dense value={value} onChange={(e) => onChange(e.target.value)} className="min-w-36">
        {children}
      </Select>
    </label>
  );
}

// "Selecionar Studio → Selecionar período → Visualizar performance."
// Fica no topo das telas que exibem dados de um studio específico. Trocar
// qualquer seletor aqui reflete em toda a aplicação (contexto global).
// Regra da seção 7: Semanal → Quinzenal → Mensal → Histórico.
export function StudioSwitcher() {
  const {
    studios,
    selectedStudioId,
    setSelectedStudioId,
    months,
    monthLabels,
    selectedMonthId,
    setSelectedMonthId,
    granularity,
    setGranularity,
    selectedWeek,
    setSelectedWeek,
    selectedQuinzenaId,
    setSelectedQuinzenaId,
  } = useStudio();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SelectField label="Studio" value={selectedStudioId} onChange={setSelectedStudioId}>
        {studios.map((studio) => (
          <option key={studio.id} value={studio.id}>
            {studio.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="Mês" value={selectedMonthId} onChange={setSelectedMonthId}>
        {months.length === 0 ? <option value={selectedMonthId}>{monthLabel(selectedMonthId)}</option> : null}
        {[...months].reverse().map((id) => (
          <option key={id} value={id}>
            {monthLabels[id] ?? id}
          </option>
        ))}
      </SelectField>

      <SelectField label="Período" value={granularity} onChange={(v) => setGranularity(v as Granularity)}>
        {GRANULARITY_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {GRANULARITY_LABEL[g]}
          </option>
        ))}
      </SelectField>

      {granularity === "semana" ? (
        <SelectField label="Semana" value={selectedWeek} onChange={(v) => setSelectedWeek(v as WeekLabel)}>
          {WEEK_LABELS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </SelectField>
      ) : null}

      {granularity === "quinzena" ? (
        <SelectField
          label="Quinzena"
          value={selectedQuinzenaId}
          onChange={(v) => setSelectedQuinzenaId(v as "Q1" | "Q2")}
        >
          {QUINZENAS.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </SelectField>
      ) : null}
    </div>
  );
}
