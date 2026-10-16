"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Granularity, QUINZENAS, aggregateWeeks, listMonths, monthLabel, weeksOfMonth } from "@/lib/period";
import { SeasonKind, seasonForMonth } from "@/lib/seasonality";
import {
  CostBreakdown,
  OPERATION_MODEL_LABEL,
  OperationModel,
  OriginCounts,
  Studio,
  StudioRecord,
  WeekLabel,
  WeeklyEntry,
} from "@/lib/types";
import { CrmLead, CrmOrigin, CrmStage } from "@/lib/crm";
import { Select } from "@/components/ui/select";

const STORAGE_STUDIO_KEY = "pilates-pro-selected-studio";

export interface NewStudioInput {
  name: string;
  city: string;
  operationModel: OperationModel;
  metaMatriculasMes: number;
  plan: Studio["plan"];
}

interface StudioContextValue {
  studios: Studio[];
  selectedStudioId: string;
  setSelectedStudioId: (id: string) => void;
  selectedStudio: Studio;

  months: string[]; // periodId, cronológico
  monthLabels: Record<string, string>;
  selectedMonthId: string;
  setSelectedMonthId: (id: string) => void;

  granularity: Granularity;
  setGranularity: (g: Granularity) => void;

  selectedWeek: WeekLabel;
  setSelectedWeek: (w: WeekLabel) => void;
  selectedQuinzenaId: "Q1" | "Q2";
  setSelectedQuinzenaId: (id: "Q1" | "Q2") => void;

  currentMetrics: ReturnType<typeof aggregateWeeks>;
  previousMetrics?: ReturnType<typeof aggregateWeeks>;
  /** Sazonalidade (seção 8.1) do mês selecionado. "normal" para histórico (abrange vários meses). */
  season: SeasonKind;

  weeksOfSelectedMonth: WeeklyEntry[];
  upsertWeeklyEntry: (entry: WeeklyEntry) => void;

  /** Métricas de qualquer mês do studio selecionado (para comparativo YoY). undefined se o mês não existe no histórico. */
  getMonthMetrics: (periodId: string) => ReturnType<typeof aggregateWeeks> | undefined;

  addStudio: (input: NewStudioInput) => string;
  updateStudio: (patch: Partial<Omit<Studio, "id" | "createdAt">>) => void;

  /** CRM do studio selecionado — leads e funil operacional. */
  crmLeads: CrmLead[];
  moveLead: (leadId: string, stage: CrmStage) => void;
  upsertLead: (lead: CrmLead) => void;
  deleteLead: (leadId: string) => void;

  /** Papel da conta logada — admin vê todos os studios, owner vê só o seu (via RLS). */
  role: "admin" | "owner";
}

const StudioContext = createContext<StudioContextValue | null>(null);

function readStoredStudioId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_STUDIO_KEY);
}

// ---------------------------------------------------------------------------
// Mapeamento linha do Supabase (snake_case) <-> tipos do app (camelCase).
// WeeklyEntry.id continua sendo o string sintético "${periodId}-${week}" só
// no TS — o banco tem seu próprio uuid como chave primária, nunca exposto
// aqui. CrmLead.id, por outro lado, É o uuid real da linha (chave primária).
// ---------------------------------------------------------------------------

interface StudioRow {
  id: string;
  name: string;
  city: string;
  operation_model: string;
  meta_matriculas_mes: number;
  plan: string;
  created_at: string;
}

function mapStudioRow(row: StudioRow): Studio {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    operationModel: row.operation_model as OperationModel,
    metaMatriculasMes: row.meta_matriculas_mes,
    plan: row.plan as Studio["plan"],
    createdAt: row.created_at.slice(0, 10),
  };
}

interface WeeklyEntryRow {
  studio_id: string;
  period_id: string;
  week: string;
  receita: number;
  custos: CostBreakdown;
  alunos_ativos_fim: number;
  matriculas_novas: number;
  cancelamentos: number;
  leads_recebidos: number;
  tempo_resposta_medio_min: number;
  experimentais_agendadas: number;
  experimentais_realizadas: number;
  no_shows: number;
  investimento_midia: number;
  origem: OriginCounts;
  capacidade_vagas: number;
}

function mapWeeklyEntryRow(row: WeeklyEntryRow): WeeklyEntry {
  return {
    id: `${row.period_id}-${row.week}`,
    periodId: row.period_id,
    week: row.week as WeekLabel,
    receita: Number(row.receita),
    custos: row.custos,
    alunosAtivosFim: row.alunos_ativos_fim,
    matriculasNovas: row.matriculas_novas,
    cancelamentos: row.cancelamentos,
    leadsRecebidos: row.leads_recebidos,
    tempoRespostaMedioMin: Number(row.tempo_resposta_medio_min),
    experimentaisAgendadas: row.experimentais_agendadas,
    experimentaisRealizadas: row.experimentais_realizadas,
    noShows: row.no_shows,
    investimentoMidia: Number(row.investimento_midia),
    origem: row.origem,
    capacidadeVagas: row.capacidade_vagas,
  };
}

function weeklyEntryToRow(studioId: string, entry: WeeklyEntry) {
  return {
    studio_id: studioId,
    period_id: entry.periodId,
    week: entry.week,
    receita: entry.receita,
    custos: entry.custos,
    alunos_ativos_fim: entry.alunosAtivosFim,
    matriculas_novas: entry.matriculasNovas,
    cancelamentos: entry.cancelamentos,
    leads_recebidos: entry.leadsRecebidos,
    tempo_resposta_medio_min: entry.tempoRespostaMedioMin,
    experimentais_agendadas: entry.experimentaisAgendadas,
    experimentais_realizadas: entry.experimentaisRealizadas,
    no_shows: entry.noShows,
    investimento_midia: entry.investimentoMidia,
    origem: entry.origem,
    capacidade_vagas: entry.capacidadeVagas,
  };
}

interface CrmLeadRow {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  origin: string;
  stage: string;
  responsible: string;
  lead_score: number;
  last_activity: string;
  obs: string;
  journey: Partial<Record<CrmStage, string>>;
}

function mapCrmLeadRow(row: CrmLeadRow): CrmLead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    origin: row.origin as CrmOrigin,
    stage: row.stage as CrmStage,
    responsible: row.responsible,
    leadScore: row.lead_score,
    lastActivity: row.last_activity,
    obs: row.obs,
    journey: row.journey ?? {},
  };
}

function crmLeadToRow(studioId: string, lead: CrmLead) {
  return {
    id: lead.id,
    studio_id: studioId,
    name: lead.name,
    phone: lead.phone,
    origin: lead.origin,
    stage: lead.stage,
    responsible: lead.responsible,
    lead_score: lead.leadScore,
    last_activity: lead.lastActivity,
    obs: lead.obs,
    journey: lead.journey,
  };
}

function logIfError(action: string, error: { message: string } | null) {
  if (error) console.error(`[studio-context] ${action} falhou:`, error.message);
}

// ---------------------------------------------------------------------------
// Tela de status cheia (loading / erro) — usada no lugar de `children` para
// que nenhum dos consumidores de useStudio() precise saber lidar com "ainda
// carregando", "sem sessão" ou "conta sem papel/studio configurado".
// ---------------------------------------------------------------------------
function FullPageStatus({ children, showSignOut = false }: { children: React.ReactNode; showSignOut?: boolean }) {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--ground) px-4 text-center">
      <p className="max-w-sm text-sm text-(--ink-3)">{children}</p>
      {showSignOut ? (
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-(--line-strong) px-4 py-2 text-[13px] font-medium text-(--ink-2) hover:border-(--brand) hover:text-(--brand)"
        >
          Sair
        </button>
      ) : null}
    </div>
  );
}

const OPERATION_MODEL_OPTIONS = Object.keys(OPERATION_MODEL_LABEL) as OperationModel[];
const PLAN_OPTIONS: Studio["plan"][] = ["Plano Essencial", "Plano Pro", "Plano Enterprise"];

// Formulário de "primeiro studio" para uma conta recém-criada, sem nenhum
// studio ainda. Não usa useStudio() (ainda não há contexto pronto pra prover
// — StudioManager depende do hook) — insere direto no Supabase e pede pro
// provider recarregar.
function FirstStudioGate({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [operationModel, setOperationModel] = useState<OperationModel>("grupo");
  const [meta, setMeta] = useState("");
  const [plan, setPlan] = useState<Studio["plan"]>("Plano Pro");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const metaNumber = Number(meta);
    if (!name.trim()) {
      setError("Informe o nome do studio.");
      return;
    }
    if (!metaNumber || metaNumber <= 0) {
      setError("Meta de matrículas/mês é obrigatória e precisa ser maior que zero.");
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("studios").insert({
      owner_id: userId,
      name: name.trim(),
      city: city.trim() || "—",
      operation_model: operationModel,
      meta_matriculas_mes: metaNumber,
      plan,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onCreated();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ground) px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-(--line) bg-(--surface) p-6 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest text-(--brand)">FRANKO PILATES PRO</p>
        <h1 className="mt-1 text-lg font-semibold text-(--ink)">Cadastre seu primeiro studio</h1>
        <p className="mt-2 text-[13px] text-(--ink-3)">
          Modelo de operação e meta de matrículas/mês são obrigatórios — sem eles o Painel C.O.N.T.R.O.L não consegue
          classificar a etapa C.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Nome do studio *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Studio Movimento Pilates"
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Cidade</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex.: São Paulo, SP"
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Modelo de operação *</span>
            <Select required value={operationModel} onChange={(e) => setOperationModel(e.target.value as OperationModel)}>
              {OPERATION_MODEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {OPERATION_MODEL_LABEL[opt]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Meta de matrículas/mês *</span>
            <input
              type="number"
              required
              min={1}
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ex.: 25"
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none placeholder:text-(--ink-3) focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[13px] font-medium text-(--ink-2)">Plano</span>
            <Select value={plan} onChange={(e) => setPlan(e.target.value as Studio["plan"])}>
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </label>
          {error ? <p className="text-[13px] font-medium text-(--bad) sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep) disabled:opacity-60"
            >
              {saving ? "Cadastrando..." : "Cadastrar studio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<"loading" | "ready" | "no-session" | "no-profile">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "owner">("owner");
  const [records, setRecords] = useState<Record<string, StudioRecord>>({});
  const [leadsByStudio, setLeadsByStudio] = useState<Record<string, CrmLead[]>>({});
  const [selectedStudioId, setSelectedStudioIdState] = useState<string>("");
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [granularity, setGranularity] = useState<Granularity>("mes");
  const [selectedWeek, setSelectedWeek] = useState<WeekLabel>("S04");
  const [selectedQuinzenaId, setSelectedQuinzenaId] = useState<"Q1" | "Q2">("Q2");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setStatus("no-session");
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("role, studio_id")
        .eq("id", user.id)
        .maybeSingle();
      logIfError("carregar profile", profileError);

      if (!profileRow) {
        if (!cancelled) {
          setUserId(user.id);
          setStatus("no-profile");
        }
        return;
      }
      const resolvedRole = profileRow.role as "admin" | "owner";

      const { data: studioRows, error: studiosError } = await supabase
        .from("studios")
        .select("*")
        .order("created_at", { ascending: true });
      logIfError("carregar studios", studiosError);

      const studios = (studioRows ?? []) as StudioRow[];
      const studioIds = studios.map((s) => s.id);

      const [{ data: weekRows, error: weeksError }, { data: leadRows, error: leadsError }] = await Promise.all([
        studioIds.length
          ? supabase.from("weekly_entries").select("*").in("studio_id", studioIds)
          : Promise.resolve({ data: [] as WeeklyEntryRow[], error: null }),
        studioIds.length
          ? supabase.from("crm_leads").select("*").in("studio_id", studioIds)
          : Promise.resolve({ data: [] as CrmLeadRow[], error: null }),
      ]);
      logIfError("carregar lançamentos semanais", weeksError);
      logIfError("carregar leads", leadsError);

      const nextRecords: Record<string, StudioRecord> = {};
      for (const row of studios) {
        nextRecords[row.id] = { studio: mapStudioRow(row), weeks: [] };
      }
      for (const row of (weekRows ?? []) as WeeklyEntryRow[]) {
        nextRecords[row.studio_id]?.weeks.push(mapWeeklyEntryRow(row));
      }
      for (const record of Object.values(nextRecords)) {
        record.weeks.sort((a, b) => (a.periodId + a.week).localeCompare(b.periodId + b.week));
      }

      const nextLeads: Record<string, CrmLead[]> = {};
      for (const row of (leadRows ?? []) as CrmLeadRow[]) {
        (nextLeads[row.studio_id] ??= []).push(mapCrmLeadRow(row));
      }

      if (cancelled) return;

      setUserId(user.id);
      setRole(resolvedRole);
      setRecords(nextRecords);
      setLeadsByStudio(nextLeads);

      const stored = readStoredStudioId();
      const initialId = stored && nextRecords[stored] ? stored : (studios[0]?.id ?? "");
      setSelectedStudioIdState(initialId);
      const months = listMonths(nextRecords[initialId]?.weeks ?? []);
      setSelectedMonthId(months[months.length - 1] ?? new Date().toISOString().slice(0, 7));
      setGranularity("mes");
      setStatus("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, reloadTick]);

  function setSelectedStudioId(id: string) {
    const record = records[id];
    if (!record) return;
    setSelectedStudioIdState(id);
    const months = listMonths(record.weeks);
    const lastMonth = months[months.length - 1] ?? new Date().toISOString().slice(0, 7);
    setSelectedMonthId(lastMonth);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_STUDIO_KEY, id);
  }

  function addStudio(input: NewStudioInput): string {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString().slice(0, 10);
    const studio: Studio = {
      id,
      name: input.name,
      city: input.city,
      operationModel: input.operationModel,
      metaMatriculasMes: input.metaMatriculasMes,
      plan: input.plan,
      createdAt,
    };
    const newRecord: StudioRecord = { studio, weeks: [] };
    setRecords((prev) => ({ ...prev, [id]: newRecord }));
    setSelectedStudioIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_STUDIO_KEY, id);
    const nowPeriodId = new Date().toISOString().slice(0, 7);
    setSelectedMonthId(nowPeriodId);
    setGranularity("semana");
    setSelectedWeek("S01");

    if (userId) {
      supabase
        .from("studios")
        .insert({
          id,
          owner_id: userId,
          name: studio.name,
          city: studio.city,
          operation_model: studio.operationModel,
          meta_matriculas_mes: studio.metaMatriculasMes,
          plan: studio.plan,
          created_at: createdAt,
        })
        .then(({ error }) => logIfError("addStudio", error));
    }
    return id;
  }

  function updateStudio(patch: Partial<Omit<Studio, "id" | "createdAt">>) {
    setRecords((prev) => {
      const record = prev[selectedStudioId];
      if (!record) return prev;
      return { ...prev, [selectedStudioId]: { ...record, studio: { ...record.studio, ...patch } } };
    });

    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.operationModel !== undefined) row.operation_model = patch.operationModel;
    if (patch.metaMatriculasMes !== undefined) row.meta_matriculas_mes = patch.metaMatriculasMes;
    if (patch.plan !== undefined) row.plan = patch.plan;
    supabase
      .from("studios")
      .update(row)
      .eq("id", selectedStudioId)
      .then(({ error }) => logIfError("updateStudio", error));
  }

  function leadsFor(studioId: string): CrmLead[] {
    return leadsByStudio[studioId] ?? [];
  }

  function moveLead(leadId: string, stage: CrmStage) {
    const today = new Date().toISOString().slice(0, 10);
    let nextJourney: Partial<Record<CrmStage, string>> | null = null;
    setLeadsByStudio((prev) => {
      const current = leadsFor(selectedStudioId);
      const next = current.map((l) => {
        if (l.id !== leadId) return l;
        // Só grava a data na primeira vez que o lead chega nessa etapa —
        // mover de volta e pra frente de novo não reescreve.
        const journey = l.journey[stage] ? l.journey : { ...l.journey, [stage]: today };
        nextJourney = journey;
        return { ...l, stage, journey };
      });
      return { ...prev, [selectedStudioId]: next };
    });
    supabase
      .from("crm_leads")
      .update({ stage, journey: nextJourney })
      .eq("id", leadId)
      .then(({ error }) => logIfError("moveLead", error));
  }

  function upsertLead(lead: CrmLead) {
    setLeadsByStudio((prev) => {
      const current = leadsFor(selectedStudioId);
      const idx = current.findIndex((l) => l.id === lead.id);
      const next = idx === -1 ? [lead, ...current] : current.map((l) => (l.id === lead.id ? lead : l));
      return { ...prev, [selectedStudioId]: next };
    });
    supabase
      .from("crm_leads")
      .upsert(crmLeadToRow(selectedStudioId, lead))
      .then(({ error }) => logIfError("upsertLead", error));
  }

  function deleteLead(leadId: string) {
    setLeadsByStudio((prev) => ({ ...prev, [selectedStudioId]: leadsFor(selectedStudioId).filter((l) => l.id !== leadId) }));
    supabase
      .from("crm_leads")
      .delete()
      .eq("id", leadId)
      .then(({ error }) => logIfError("deleteLead", error));
  }

  function upsertWeeklyEntry(entry: WeeklyEntry) {
    setRecords((prev) => {
      const record = prev[selectedStudioId];
      if (!record) return prev;
      const idx = record.weeks.findIndex((w) => w.id === entry.id);
      const nextWeeks = [...record.weeks];
      if (idx === -1) {
        nextWeeks.push(entry);
        nextWeeks.sort((a, b) => (a.periodId + a.week).localeCompare(b.periodId + b.week));
      } else {
        nextWeeks[idx] = entry;
      }
      return { ...prev, [selectedStudioId]: { ...record, weeks: nextWeeks } };
    });
    supabase
      .from("weekly_entries")
      .upsert(weeklyEntryToRow(selectedStudioId, entry), { onConflict: "studio_id,period_id,week" })
      .then(({ error }) => logIfError("upsertWeeklyEntry", error));
  }

  const value = useMemo<StudioContextValue | null>(() => {
    const record = records[selectedStudioId];
    if (!record) return null;
    const allWeeks = record.weeks;
    const months = listMonths(allWeeks);
    const resolvedMonthId = months.includes(selectedMonthId) ? selectedMonthId : months[months.length - 1] ?? selectedMonthId;
    const monthLabels = Object.fromEntries(months.map((id) => [id, monthLabel(id)]));

    const monthWeeks = weeksOfMonth(allWeeks, resolvedMonthId);
    const monthIndex = months.indexOf(resolvedMonthId);
    const prevMonthWeeks = monthIndex > 0 ? weeksOfMonth(allWeeks, months[monthIndex - 1]) : [];

    let currentSlice: WeeklyEntry[] = [];
    let previousSlice: WeeklyEntry[] = [];
    let rangeLabel = monthLabel(resolvedMonthId);

    if (granularity === "semana") {
      const idx = allWeeks.findIndex((w) => w.periodId === resolvedMonthId && w.week === selectedWeek);
      currentSlice = idx === -1 ? [] : [allWeeks[idx]];
      previousSlice = idx > 0 ? [allWeeks[idx - 1]] : [];
      rangeLabel = `${selectedWeek} · ${monthLabel(resolvedMonthId)}`;
    } else if (granularity === "quinzena") {
      const quinzena = QUINZENAS.find((q) => q.id === selectedQuinzenaId)!;
      currentSlice = monthWeeks.filter((w) => quinzena.weeks.includes(w.week));
      if (selectedQuinzenaId === "Q2") {
        previousSlice = monthWeeks.filter((w) => QUINZENAS[0].weeks.includes(w.week));
      } else {
        previousSlice = prevMonthWeeks.filter((w) => QUINZENAS[1].weeks.includes(w.week));
      }
      rangeLabel = `${quinzena.label} · ${monthLabel(resolvedMonthId)}`;
    } else if (granularity === "mes") {
      currentSlice = monthWeeks;
      previousSlice = prevMonthWeeks;
      rangeLabel = monthLabel(resolvedMonthId);
    } else {
      currentSlice = allWeeks;
      previousSlice = [];
      rangeLabel = "Histórico completo";
    }

    const currentMetrics = aggregateWeeks(currentSlice, rangeLabel);
    const previousMetrics = previousSlice.length ? aggregateWeeks(previousSlice, "período anterior") : undefined;
    const season: SeasonKind = granularity === "historico" ? "normal" : seasonForMonth(resolvedMonthId);

    function getMonthMetrics(periodId: string) {
      if (!months.includes(periodId)) return undefined;
      return aggregateWeeks(weeksOfMonth(allWeeks, periodId), monthLabel(periodId));
    }

    return {
      studios: Object.values(records).map((r) => r.studio),
      selectedStudioId: record.studio.id,
      setSelectedStudioId,
      selectedStudio: record.studio,
      months,
      monthLabels,
      selectedMonthId: resolvedMonthId,
      setSelectedMonthId,
      granularity,
      setGranularity,
      selectedWeek,
      setSelectedWeek,
      selectedQuinzenaId,
      setSelectedQuinzenaId,
      currentMetrics,
      previousMetrics,
      season,
      weeksOfSelectedMonth: monthWeeks,
      upsertWeeklyEntry,
      getMonthMetrics,
      addStudio,
      updateStudio,
      crmLeads: leadsFor(selectedStudioId),
      moveLead,
      upsertLead,
      deleteLead,
      role,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, leadsByStudio, selectedStudioId, selectedMonthId, granularity, selectedWeek, selectedQuinzenaId, role]);

  if (status === "loading") {
    return <FullPageStatus>Carregando seus dados...</FullPageStatus>;
  }
  if (status === "no-session") {
    return <FullPageStatus>Sessão não encontrada — atualize a página para entrar novamente.</FullPageStatus>;
  }
  if (status === "no-profile") {
    return (
      <FullPageStatus showSignOut>
        Sua conta ainda não tem acesso configurado. Fale com o administrador para vincular seu login a um studio.
      </FullPageStatus>
    );
  }
  if (!value) {
    if (role === "admin") {
      return <FirstStudioGate userId={userId!} onCreated={() => setReloadTick((t) => t + 1)} />;
    }
    return (
      <FullPageStatus showSignOut>
        Nenhum studio vinculado à sua conta ainda. Fale com o administrador.
      </FullPageStatus>
    );
  }

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio deve ser usado dentro de <StudioProvider>");
  return ctx;
}
