"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStudio } from "@/components/studio-context";
import { OPERATION_MODEL_LABEL, OPERATION_MODEL_SHORT, OperationModel, Studio } from "@/lib/types";
import { Select } from "@/components/ui/select";

const OPERATION_MODEL_OPTIONS = Object.keys(OPERATION_MODEL_LABEL) as OperationModel[];
const PLAN_OPTIONS: Studio["plan"][] = ["Plano Essencial", "Plano Pro", "Plano Enterprise"];

function StudioCard({ studio, active, onSelect }: { studio: Studio; active: boolean; onSelect: () => void }) {
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border bg-(--surface) p-5 shadow-sm ${
        active ? "border-(--brand) ring-1 ring-(--brand)" : "border-(--line)"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-(--ink)">{studio.name}</h3>
          {active ? (
            <span className="shrink-0 rounded-md bg-(--brand)/10 px-2 py-0.5 text-[11px] font-semibold text-(--brand)">
              Ativo
            </span>
          ) : null}
        </div>
        <p className="text-[13px] text-(--ink-3)">{studio.city}</p>
        <div className="mt-3 space-y-1.5 text-[13px] text-(--ink-2)">
          <p>
            <span className="text-(--ink-3)">Modelo:</span> {OPERATION_MODEL_SHORT[studio.operationModel]}
          </p>
          <p>
            <span className="text-(--ink-3)">Meta de matrículas/mês:</span> {studio.metaMatriculasMes}
          </p>
          <p>
            <span className="text-(--ink-3)">Plano:</span> {studio.plan}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSelect}
        disabled={active}
        className={`mt-4 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
          active
            ? "cursor-default bg-(--surface-3) text-(--ink-3)"
            : "bg-(--brand) text-white hover:bg-(--brand-deep)"
        }`}
      >
        {active ? "Studio selecionado" : "Ver Central de Performance"}
      </button>
    </div>
  );
}

export function StudioManager() {
  const router = useRouter();
  const { studios, selectedStudioId, setSelectedStudioId, addStudio } = useStudio();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [operationModel, setOperationModel] = useState<OperationModel>("grupo");
  const [meta, setMeta] = useState("");
  const [plan, setPlan] = useState<Studio["plan"]>("Plano Pro");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setCity("");
    setOperationModel("grupo");
    setMeta("");
    setPlan("Plano Pro");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const metaNumber = Number(meta);
    if (!name.trim()) {
      setError("Informe o nome do studio.");
      return;
    }
    if (!metaNumber || metaNumber <= 0) {
      setError("Meta de matrículas/mês é obrigatória e precisa ser maior que zero — sem ela a etapa C não pode ser classificada.");
      return;
    }
    addStudio({ name: name.trim(), city: city.trim() || "—", operationModel, metaMatriculasMes: metaNumber, plan });
    resetForm();
    setShowForm(false);
    router.push("/");
  }

  function selectStudio(id: string) {
    setSelectedStudioId(id);
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--ink-3)">
          {studios.length} {studios.length === 1 ? "studio cadastrado" : "studios cadastrados"}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep)"
        >
          {showForm ? "Cancelar" : "+ Novo Studio"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-(--line) bg-(--surface) p-6 shadow-sm"
        >
          <p className="mb-4 text-sm text-(--ink-3)">
            Onboarding do studio. Modelo de operação e meta de matrículas/mês são obrigatórios — sem eles o Painel
            C.O.N.T.R.O.L não consegue classificar a etapa C.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Nome do studio *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Studio Movimento Pilates"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink-2) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Cidade</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: São Paulo, SP"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink-2) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">
                Modelo de operação *
              </span>
              <Select required value={operationModel} onChange={(e) => setOperationModel(e.target.value as OperationModel)}>
                {OPERATION_MODEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {OPERATION_MODEL_LABEL[opt]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">
                Meta de matrículas/mês *
              </span>
              <input
                type="number"
                required
                min={1}
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder="Ex.: 25"
                className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink-2) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-(--ink-2)">Plano</span>
              <Select value={plan} onChange={(e) => setPlan(e.target.value as Studio["plan"])}>
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {error ? <p className="mt-3 text-[13px] font-medium text-(--bad)">{error}</p> : null}
          <div className="mt-5">
            <button
              type="submit"
              className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep)"
            >
              Cadastrar studio
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {studios.map((studio) => (
          <StudioCard
            key={studio.id}
            studio={studio}
            active={studio.id === selectedStudioId}
            onSelect={() => selectStudio(studio.id)}
          />
        ))}
      </div>
    </div>
  );
}
