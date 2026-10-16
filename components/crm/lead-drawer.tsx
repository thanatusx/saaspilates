"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DrawerBody, DrawerHeader } from "@/components/drawer/drawer-shell";
import { useDrawer } from "@/components/drawer/drawer-context";
import { useStudio } from "@/components/studio-context";
import { CRM_ORIGIN_LABEL, CRM_STAGES, CrmLead, CrmOrigin, CrmStage } from "@/lib/crm";
import { Select } from "@/components/ui/select";

function emptyLead(): CrmLead {
  return {
    id: crypto.randomUUID(),
    name: "",
    phone: "",
    origin: "instagram",
    stage: "novo",
    responsible: "",
    leadScore: 50,
    lastActivity: new Date().toISOString().slice(0, 10),
    obs: "",
    journey: {},
  };
}

export function LeadDrawerContent({ lead }: { lead?: CrmLead }) {
  const { closeDrawer } = useDrawer();
  const { upsertLead, deleteLead } = useStudio();
  const [form, setForm] = useState<CrmLead>(lead ?? emptyLead());
  const isNew = !lead;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const journey = { ...form.journey };
    if (!journey.novo) journey.novo = today;
    if (!journey[form.stage]) journey[form.stage] = today;
    upsertLead({ ...form, name: form.name.trim() || "Sem nome", journey });
    closeDrawer();
  }

  return (
    <>
      <DrawerHeader eyebrow={isNew ? "NOVO LEAD" : "EDITAR LEAD"} title={isNew ? "Cadastrar oportunidade" : form.name} />
      <DrawerBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Nome</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Telefone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Origem</span>
            <Select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as CrmOrigin })}>
              {Object.entries(CRM_ORIGIN_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Etapa do funil</span>
            <Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as CrmStage })}>
              {CRM_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Responsável</span>
            <input
              value={form.responsible}
              onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Lead score (0-100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.leadScore}
              onChange={(e) => setForm({ ...form, leadScore: Number(e.target.value) })}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Observações</span>
            <textarea
              rows={3}
              value={form.obs}
              onChange={(e) => setForm({ ...form, obs: e.target.value })}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white transition-[opacity,background-color] duration-150 hover:opacity-90"
            >
              Salvar
            </button>
            {!isNew ? (
              <button
                type="button"
                onClick={() => {
                  deleteLead(form.id);
                  closeDrawer();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-(--bad)/40 px-4 py-2 text-sm font-medium text-(--bad) hover:bg-(--bad-wash)"
              >
                <Trash2 size={15} strokeWidth={1.75} /> Excluir
              </button>
            ) : null}
          </div>
        </form>
      </DrawerBody>
    </>
  );
}
