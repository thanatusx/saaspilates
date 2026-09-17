// Tipos centrais do sistema multi-studio.
// A FRANKO administra vários studios de Pilates (clientes). Cada studio tem
// seu próprio conjunto de dados; nada aqui deve assumir "um único studio".
//
// Fonte da verdade: lançamentos SEMANAIS (WeeklyEntry). Tudo que é mensal
// (Painel C.O.N.T.R.O.L, indicadores, meta de matrículas) é uma AGREGAÇÃO das
// semanas — nunca lançado diretamente. Ver lib/period.ts.

export type OperationModel = "boutique" | "grupo" | "clinica" | "franquia";

export const OPERATION_MODEL_LABEL: Record<OperationModel, string> = {
  boutique: "Boutique / individual (1:1 ou trios)",
  grupo: "Grupo / Reformer coletivo (10–15 por turma)",
  clinica: "Clínica + Pilates",
  franquia: "Franquia",
};

export const OPERATION_MODEL_SHORT: Record<OperationModel, string> = {
  boutique: "Boutique",
  grupo: "Grupo / Reformer",
  clinica: "Clínica + Pilates",
  franquia: "Franquia",
};

export interface Studio {
  id: string;
  name: string;
  city: string;
  operationModel: OperationModel;
  /** Meta de matrículas/mês definida na anamnese comercial (etapa C — CONTEXTO). Obrigatório. NÃO é semanal. */
  metaMatriculasMes: number;
  plan: "Plano Pro" | "Plano Essencial" | "Plano Enterprise";
  createdAt: string; // ISO date do onboarding
}

export type WeekLabel = "S01" | "S02" | "S03" | "S04";
export const WEEK_LABELS: WeekLabel[] = ["S01", "S02", "S03", "S04"];

// Canais de origem — base da etapa N. Fixos (mesma ordem em toda a UI).
export const ORIGIN_CHANNELS = [
  "Instagram / tráfego pago",
  "Google",
  "Indicação",
  "Parcerias médicas",
  "Agregadores",
] as const;
export type OriginChannel = (typeof ORIGIN_CHANNELS)[number];

export interface CostBreakdown {
  folha: number;
  aluguel: number;
  marketing: number;
  outros: number;
}

export function emptyCostBreakdown(): CostBreakdown {
  return { folha: 0, aluguel: 0, marketing: 0, outros: 0 };
}

export function sumCosts(c: CostBreakdown): number {
  return c.folha + c.aluguel + c.marketing + c.outros;
}

export type OriginCounts = Partial<Record<OriginChannel, number>>;

export function sumOrigin(o: OriginCounts): number {
  return ORIGIN_CHANNELS.reduce((sum, ch) => sum + (o[ch] ?? 0), 0);
}

// Um lançamento semanal — exatamente os "campos mínimos por semana" da
// seção 6. Preenchimento semanal, não diário.
export interface WeeklyEntry {
  id: string; // `${periodId}-${week}`, ex.: "2024-08-S01"
  periodId: string; // mês a que a semana pertence, ex.: "2024-08"
  week: WeekLabel;

  receita: number;
  custos: CostBreakdown;

  alunosAtivosFim: number;
  matriculasNovas: number;
  cancelamentos: number;

  leadsRecebidos: number; // -> etapa T
  tempoRespostaMedioMin: number; // -> etapa R
  experimentaisAgendadas: number; // -> etapa R
  experimentaisRealizadas: number; // -> etapas R/O
  noShows: number; // -> etapa R

  investimentoMidia: number; // -> etapas T/N

  /** Origem de cada aluno novo. Obrigatório — sem isso a etapa N fica Crítica. */
  origem: OriginCounts;

  capacidadeVagas: number; // para ocupação real
}

export function emptyWeeklyEntry(periodId: string, week: WeekLabel): WeeklyEntry {
  return {
    id: `${periodId}-${week}`,
    periodId,
    week,
    receita: 0,
    custos: emptyCostBreakdown(),
    alunosAtivosFim: 0,
    matriculasNovas: 0,
    cancelamentos: 0,
    leadsRecebidos: 0,
    tempoRespostaMedioMin: 0,
    experimentaisAgendadas: 0,
    experimentaisRealizadas: 0,
    noShows: 0,
    investimentoMidia: 0,
    origem: {},
    capacidadeVagas: 0,
  };
}

export interface StudioRecord {
  studio: Studio;
  /** Ordem cronológica, mais antiga primeiro. Fonte única de dados do studio. */
  weeks: WeeklyEntry[];
}

// ---------------------------------------------------------------------------
// Métricas agregadas (semana/quinzena/mês/histórico) — o que a Central de
// Performance, Indicadores e Insights efetivamente consomem. Sempre
// calculado a partir de WeeklyEntry[]; nunca lançado diretamente.
// ---------------------------------------------------------------------------
export interface WeeklyPoint {
  week: WeekLabel;
  matriculas: number;
  receita: number;
  cancelamentos: number;
  alunosAtivos: number;
}

export interface OriginBreakdownItem {
  label: string;
  value: number;
  color: string;
}

export interface AggregatedMetrics {
  rangeLabel: string; // ex.: "S01 · Agosto 2024", "Agosto 2024", "Histórico completo"

  matriculasRealizadas: number;
  alunosAtivos: number; // estoque no fim do intervalo
  receitaMensal: number;
  custosTotal: number;
  custos: CostBreakdown;

  leads: number;
  investimentoMidia: number;

  experimentaisAgendadas: number;
  experimentaisRealizadas: number;
  matriculasViaExperimental: number; // aproximado por matriculasRealizadas

  tempoRespostaMedioMin: number;
  taxaNoShowPct: number;

  cancelamentos: number;
  churnPct: number;
  ltv: number;
  roiPct: number;

  origensRastreadasPct: number;
  ocupacaoPreenchimentoPct: number; // % das semanas do intervalo com capacidade lançada
  ocupacaoPct: number;

  weekly: WeeklyPoint[]; // as semanas que compõem este intervalo (para os gráficos)
  origin: OriginBreakdownItem[];
}
