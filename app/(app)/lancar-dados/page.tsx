"use client";

import { PageHeader } from "@/components/page-header";
import { useStudio } from "@/components/studio-context";
import { WeeklyEntryForm } from "@/components/lancar-dados/weekly-entry-form";
import { Select } from "@/components/ui/select";

export default function LancarDadosPage() {
  const { studios, selectedStudioId, setSelectedStudioId } = useStudio();

  return (
    <>
      <PageHeader
        title="Lançar Dados"
        subtitle="Cadastro semanal (S01-S04) — a parte mais importante do sistema. Alimenta o Painel C.O.N.T.R.O.L, os indicadores e os gráficos automaticamente."
        below={
          <label className="flex items-center gap-2 text-[13px]">
            <span className="text-(--ink-3)">Studio</span>
            <Select dense value={selectedStudioId} onChange={(e) => setSelectedStudioId(e.target.value)} className="min-w-48">
              {studios.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </Select>
          </label>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <WeeklyEntryForm />
      </div>
    </>
  );
}
