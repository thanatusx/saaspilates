import {
  AggregatedMetrics,
  ORIGIN_CHANNELS,
  OriginBreakdownItem,
  WEEK_LABELS,
  WeekLabel,
  WeeklyEntry,
  WeeklyPoint,
  emptyCostBreakdown,
  sumCosts,
} from "./types";

// ---------------------------------------------------------------------------
// Seção 7 — Sistema de filtros e períodos.
// Regra: Semanal → Quinzenal → Mensal → Histórico. Sem depender de
// lançamento diário. Tudo aqui só CONSOLIDA WeeklyEntry[]; nada é lançado
// neste nível.
// ---------------------------------------------------------------------------
export type Granularity = "semana" | "quinzena" | "mes" | "historico";

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  semana: "1 semana",
  quinzena: "2 semanas",
  mes: "Mês completo",
  historico: "Histórico",
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function monthLabel(periodId: string): string {
  const [year, month] = periodId.split("-").map(Number);
  const name = MONTH_NAMES[(month ?? 1) - 1] ?? periodId;
  return `${name} ${year}`;
}

/** As duas quinzenas de um mês: Q1 = S01+S02, Q2 = S03+S04. */
export const QUINZENAS: { id: "Q1" | "Q2"; label: string; weeks: WeekLabel[] }[] = [
  { id: "Q1", label: "Quinzena 1 (S01-S02)", weeks: ["S01", "S02"] },
  { id: "Q2", label: "Quinzena 2 (S03-S04)", weeks: ["S03", "S04"] },
];

export function listMonths(weeks: WeeklyEntry[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const w of weeks) {
    if (!seen.has(w.periodId)) {
      seen.add(w.periodId);
      order.push(w.periodId);
    }
  }
  return order;
}

export function weeksOfMonth(weeks: WeeklyEntry[], periodId: string): WeeklyEntry[] {
  return WEEK_LABELS.map((label) => weeks.find((w) => w.periodId === periodId && w.week === label)).filter(
    (w): w is WeeklyEntry => Boolean(w)
  );
}

/** Agrega uma lista de semanas (já filtrada para o intervalo desejado) em AggregatedMetrics. */
export function aggregateWeeks(weeks: WeeklyEntry[], rangeLabel: string): AggregatedMetrics {
  if (weeks.length === 0) {
    return {
      rangeLabel,
      matriculasRealizadas: 0,
      alunosAtivos: 0,
      receitaMensal: 0,
      custosTotal: 0,
      custos: emptyCostBreakdown(),
      leads: 0,
      investimentoMidia: 0,
      experimentaisAgendadas: 0,
      experimentaisRealizadas: 0,
      matriculasViaExperimental: 0,
      tempoRespostaMedioMin: 0,
      taxaNoShowPct: 0,
      cancelamentos: 0,
      churnPct: 0,
      ltv: 0,
      roiPct: 0,
      origensRastreadasPct: 0,
      ocupacaoPreenchimentoPct: 0,
      ocupacaoPct: 0,
      weekly: [],
      origin: [],
    };
  }

  const receitaMensal = weeks.reduce((s, w) => s + w.receita, 0);
  const custos = weeks.reduce(
    (acc, w) => ({
      folha: acc.folha + w.custos.folha,
      aluguel: acc.aluguel + w.custos.aluguel,
      marketing: acc.marketing + w.custos.marketing,
      outros: acc.outros + w.custos.outros,
    }),
    emptyCostBreakdown()
  );
  const custosTotal = sumCosts(custos);

  const matriculasRealizadas = weeks.reduce((s, w) => s + w.matriculasNovas, 0);
  const cancelamentos = weeks.reduce((s, w) => s + w.cancelamentos, 0);
  const leads = weeks.reduce((s, w) => s + w.leadsRecebidos, 0);
  const investimentoMidia = weeks.reduce((s, w) => s + w.investimentoMidia, 0);
  const experimentaisAgendadas = weeks.reduce((s, w) => s + w.experimentaisAgendadas, 0);
  const experimentaisRealizadas = weeks.reduce((s, w) => s + w.experimentaisRealizadas, 0);
  const noShows = weeks.reduce((s, w) => s + w.noShows, 0);

  // Estoque, não fluxo: pega o fim da última semana do intervalo.
  const alunosAtivos = weeks[weeks.length - 1].alunosAtivosFim;
  const alunosAtivosMedio = weeks.reduce((s, w) => s + w.alunosAtivosFim, 0) / weeks.length;

  const tempoRespostaMedioMin = weeks.reduce((s, w) => s + w.tempoRespostaMedioMin, 0) / weeks.length;
  const taxaNoShowPct = experimentaisAgendadas ? (noShows / experimentaisAgendadas) * 100 : 0;

  // Churn no intervalo: cancelamentos sobre a base média de alunos ativos. [CALIBRAR]
  const churnPct = alunosAtivosMedio ? (cancelamentos / alunosAtivosMedio) * 100 : 0;

  const ticketMedio = alunosAtivos ? receitaMensal / alunosAtivos : 0;
  // LTV estimado: ticket médio × vida útil média (1/churn mensal), limitado a 36 meses. [CALIBRAR]
  const churnMensalFrac = Math.min(Math.max(churnPct / 100, 0.01), 1);
  const lifetimeMeses = Math.min(1 / churnMensalFrac, 36);
  const ltv = ticketMedio * lifetimeMeses;
  const cac = matriculasRealizadas ? investimentoMidia / matriculasRealizadas : 0;
  const roiPct = cac ? ((ltv - cac) / cac) * 100 : 0;

  const origin: OriginBreakdownItem[] = ORIGIN_CHANNELS.map((label, i) => ({
    label,
    value: weeks.reduce((s, w) => s + (w.origem[label] ?? 0), 0),
    color: CATEGORICAL_SLOTS[i],
  })).filter((o) => o.value > 0);
  const origemTotal = origin.reduce((s, o) => s + o.value, 0);
  const origensRastreadasPct = matriculasRealizadas ? (origemTotal / matriculasRealizadas) * 100 : 0;

  const weeksComCapacidade = weeks.filter((w) => w.capacidadeVagas > 0);
  const ocupacaoPreenchimentoPct = (weeksComCapacidade.length / weeks.length) * 100;
  const ocupacaoPct = weeksComCapacidade.length
    ? (weeksComCapacidade.reduce((s, w) => s + w.alunosAtivosFim / w.capacidadeVagas, 0) / weeksComCapacidade.length) *
      100
    : 0;

  const weekly: WeeklyPoint[] = weeks.map((w) => ({
    week: w.week,
    matriculas: w.matriculasNovas,
    receita: w.receita,
    cancelamentos: w.cancelamentos,
    alunosAtivos: w.alunosAtivosFim,
  }));

  return {
    rangeLabel,
    matriculasRealizadas,
    alunosAtivos,
    receitaMensal,
    custosTotal,
    custos,
    leads,
    investimentoMidia,
    experimentaisAgendadas,
    experimentaisRealizadas,
    matriculasViaExperimental: matriculasRealizadas,
    tempoRespostaMedioMin,
    taxaNoShowPct,
    cancelamentos,
    churnPct,
    ltv,
    roiPct,
    origensRastreadasPct,
    ocupacaoPreenchimentoPct,
    ocupacaoPct,
    weekly,
    origin,
  };
}

// Paleta categórica fixa (ordem nunca trocada) — slots 1..5 da paleta padrão.
export const CATEGORICAL_SLOTS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

// ---------------------------------------------------------------------------
// Ponte pra integrações externas que exigem data de calendário (Meta Ads
// Insights, por ex.) — o modelo de período do app não guarda datas reais por
// semana (S01-S04 são só rótulos dentro de um mês), então aproximamos cada
// semana a uma faixa fixa de dias. É uma aproximação documentada, não uma
// data exata — mudar isso pra datas reais por semana é escopo bem maior.
// ---------------------------------------------------------------------------
const WEEK_DAY_BAND: Record<WeekLabel, [number, number | null]> = {
  S01: [1, 7],
  S02: [8, 14],
  S03: [15, 21],
  S04: [22, null], // null = até o último dia do mês
};

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function monthBounds(periodId: string): { year: number; month: number; lastDay: number } {
  const [year, month] = periodId.split("-").map(Number);
  return { year, month, lastDay: daysInMonth(year, month) };
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** since/until (YYYY-MM-DD) pro período atualmente selecionado no app. */
export function periodDateRange(
  months: string[],
  granularity: Granularity,
  monthId: string,
  week: WeekLabel,
  quinzenaId: "Q1" | "Q2"
): { since: string; until: string } {
  if (granularity === "historico") {
    if (months.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      return { since: today, until: today };
    }
    const first = monthBounds(months[0]);
    const last = monthBounds(months[months.length - 1]);
    return { since: dateStr(first.year, first.month, 1), until: dateStr(last.year, last.month, last.lastDay) };
  }

  const { year, month, lastDay } = monthBounds(monthId);

  if (granularity === "mes") {
    return { since: dateStr(year, month, 1), until: dateStr(year, month, lastDay) };
  }

  if (granularity === "quinzena") {
    if (quinzenaId === "Q1") return { since: dateStr(year, month, 1), until: dateStr(year, month, Math.min(14, lastDay)) };
    return { since: dateStr(year, month, Math.min(15, lastDay)), until: dateStr(year, month, lastDay) };
  }

  const [start, endRaw] = WEEK_DAY_BAND[week];
  const end = Math.min(endRaw ?? lastDay, lastDay);
  return { since: dateStr(year, month, Math.min(start, lastDay)), until: dateStr(year, month, end) };
}
