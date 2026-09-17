import {
  CONTROL_LETTER_ORDER,
  CONTROL_STAGE_META,
  ControlLetter,
  StatusKey,
  statusFromLevel,
  worseStatus,
} from "./control-method";
import { REFERENCE_RANGES } from "./reference-ranges";
import { SeasonKind, capSeasonalStatus, seasonalAdjust } from "./seasonality";
import { OPERATION_MODEL_SHORT, AggregatedMetrics, Studio } from "./types";

// ---------------------------------------------------------------------------
// Motor de diagnóstico: transforma números crus (AggregatedMetrics) em status.
//
// Os cortes abaixo vêm da tabela da seção 8 — cada bloco cita se lá o corte
// está marcado [SÓLIDO] (validado pela FK) ou [CALIBRAR] (provisório, ainda a
// validar por segmento). Nenhuma regra do motor de diagnóstico (9.1) usa um
// corte diferente destes — sempre os mesmos números.
// ---------------------------------------------------------------------------

function bandLevel(value: number, cuts: [number, number, number, number], higherIsBetter = true): number {
  // cuts = os 4 limiares que separam excelente/bom/estável/atenção/crítico,
  // em ordem crescente. higherIsBetter=false inverte a leitura (ex.: CPL).
  const [c1, c2, c3, c4] = cuts;
  if (higherIsBetter) {
    if (value >= c1) return 5;
    if (value >= c2) return 4;
    if (value >= c3) return 3;
    if (value >= c4) return 2;
    return 1;
  }
  if (value <= c1) return 5;
  if (value <= c2) return 4;
  if (value <= c3) return 3;
  if (value <= c4) return 2;
  return 1;
}

// Para indicadores que a seção 8 só descreve em 3 faixas nomeadas
// (Saudável/Ideal · Atenção · Crítico), sem Excelente/Estável distintos.
// "Saudável"/"Ideal" vira "bom" — é a faixa-alvo, não um resultado excepcional.
function threeTierLevel(value: number, healthyMin: number, warnMin: number): number {
  if (value >= healthyMin) return 4; // bom
  if (value >= warnMin) return 2; // atenção
  return 1; // crítico
}

function threeTierLevelInverse(value: number, healthyMax: number, warnMax: number): number {
  if (value <= healthyMax) return 4; // bom
  if (value <= warnMax) return 2; // atenção
  return 1; // crítico
}

export interface ComputedIndicator {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  status: StatusKey;
  /** Texto exibido no chip (ex.: "T / N", "Resultado (C+T+O+L)"). "" quando o indicador não mede etapa nenhuma. */
  stageLabel: string;
  /** Etapas que este indicador alimenta, para agrupar a página de Indicadores. Vazio = indicador geral. */
  stages: ControlLetter[];
  /** true = indicador-resultado (cruza várias etapas-causa), como a ocupação — nunca vira causa isolada. */
  isResult?: boolean;
  /** Faixa de referência usada para julgar o número (mostrada na UI). */
  reference: string;
  /** [SÓLIDO] = corte já validado pela FK · [CALIBRAR] = corte provisório, ainda a validar por segmento. */
  base: "solido" | "calibrar" | "informativo";
  trend?: string;
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : (n / d) * 100;
}

function formatPct(v: number, digits = 0) {
  return `${v.toFixed(digits)}%`;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Todas as razões derivadas de AggregatedMetrics, calculadas uma única vez e
// reaproveitadas pelos semáforos, pelos indicadores e pelo motor de
// diagnóstico (9.1) — para garantir que todo mundo lê o mesmo número.
// ---------------------------------------------------------------------------
export interface DerivedRatios {
  matriculasRatio: number; // matrículas realizadas ÷ meta/mês, bruto (sem ajuste sazonal)
  ticketMedio: number;
  ticketDeltaPct: number; // tendência vs. período anterior
  margemPct: number;
  cpl: number;
  cac: number;
  cacMultiplo: number; // CAC ÷ ticket médio (mensalidade)
  conversaoExperimental: number;
  agendamentoRate: number; // experimentais agendadas ÷ leads
  comparecimentoRate: number; // experimentais realizadas ÷ agendadas
  ltvCac: number;
  churnPct: number;
  noShowPct: number;
  tempoResposta: number;
  origensRastreadasPct: number;
  ocupacaoPct: number;
  ocupacaoPreenchimentoPct: number;
  crescimentoReceitaPct?: number; // vs. período anterior
  folhaPct: number; // folha ÷ custos totais
  marketingPct: number; // investimento em mídia ÷ receita
}

export function computeRatios(studio: Studio, cur: AggregatedMetrics, prev?: AggregatedMetrics): DerivedRatios {
  const ticketMedio = cur.alunosAtivos ? cur.receitaMensal / cur.alunosAtivos : 0;
  const ticketPrev = prev?.alunosAtivos ? prev.receitaMensal / prev.alunosAtivos : undefined;
  const ticketDeltaPct = ticketPrev ? ((ticketMedio - ticketPrev) / ticketPrev) * 100 : 0;

  const cac = cur.matriculasRealizadas ? cur.investimentoMidia / cur.matriculasRealizadas : 0;

  return {
    matriculasRatio: pct(cur.matriculasRealizadas, studio.metaMatriculasMes),
    ticketMedio,
    ticketDeltaPct,
    margemPct: cur.receitaMensal ? pct(cur.receitaMensal - cur.custosTotal, cur.receitaMensal) : 0,
    cpl: cur.leads ? cur.investimentoMidia / cur.leads : 0,
    cac,
    cacMultiplo: ticketMedio ? cac / ticketMedio : 0,
    conversaoExperimental: pct(cur.matriculasViaExperimental, cur.experimentaisRealizadas),
    agendamentoRate: pct(cur.experimentaisAgendadas, cur.leads),
    comparecimentoRate: pct(cur.experimentaisRealizadas, cur.experimentaisAgendadas),
    ltvCac: cac ? cur.ltv / cac : 0,
    churnPct: cur.churnPct,
    noShowPct: cur.taxaNoShowPct,
    tempoResposta: cur.tempoRespostaMedioMin,
    origensRastreadasPct: cur.origensRastreadasPct,
    ocupacaoPct: cur.ocupacaoPct,
    ocupacaoPreenchimentoPct: cur.ocupacaoPreenchimentoPct,
    crescimentoReceitaPct: prev?.receitaMensal
      ? ((cur.receitaMensal - prev.receitaMensal) / prev.receitaMensal) * 100
      : undefined,
    folhaPct: cur.custosTotal ? pct(cur.custos.folha, cur.custosTotal) : 0,
    marketingPct: cur.receitaMensal ? pct(cur.investimentoMidia, cur.receitaMensal) : 0,
  };
}

// --- Etapa C — CONTEXTO -----------------------------------------------------
// Matrículas vs. meta — [CALIBRAR] · seção 8. Sazonal (fluxo).
function stageContexto(studio: Studio, cur: AggregatedMetrics, r: DerivedRatios, season: SeasonKind) {
  const ratioAdj = seasonalAdjust(r.matriculasRatio, season);
  const ratioLevel = bandLevel(ratioAdj, [110, 100, 90, 75]);
  // Preenchimento da grade de ocupação (dado lançado, não resultado de negócio) — sem corte na seção 8, mantido provisório.
  const fillLevel = bandLevel(cur.ocupacaoPreenchimentoPct, [95, 85, 70, 50]); // [CALIBRAR]
  const status = capSeasonalStatus(statusFromLevel(Math.min(ratioLevel, fillLevel)), season);
  return {
    status,
    summary: `${cur.matriculasRealizadas}/${studio.metaMatriculasMes} matrículas · ${formatPct(r.ocupacaoPct)} ocupação`,
  };
}

// --- Etapa O¹ — OFERTA -------------------------------------------------------
// Ticket médio — [SÓLIDO] · classificado por TENDÊNCIA, não valor cru (a régua por modelo vive em reference-ranges e só aparece como contexto).
function stageOferta(r: DerivedRatios, hasPrev: boolean) {
  if (!hasPrev) {
    return { status: "estavel" as StatusKey, summary: `${formatCurrency(r.ticketMedio)} ticket médio` };
  }
  // Queda = guerra de preço. A seção 8 não fixa os pontos de corte da tendência — mantido [CALIBRAR].
  const level = bandLevel(r.ticketDeltaPct, [1, 0, -1, -5]);
  return {
    status: statusFromLevel(level),
    summary: `${formatCurrency(r.ticketMedio)} ticket médio (${r.ticketDeltaPct >= 0 ? "+" : ""}${r.ticketDeltaPct.toFixed(1)}%)`,
  };
}

// --- Etapa N — NÚMEROS -------------------------------------------------------
// % origens rastreadas — [SÓLIDO] · seção 8 (3 faixas). CAC — [CALIBRAR] · etapas T/N.
function stageNumeros(cur: AggregatedMetrics, r: DerivedRatios) {
  const origemLevel = threeTierLevel(r.origensRastreadasPct, 100, 80);
  const cacLevel = bandLevel(r.cacMultiplo, [0.5, 1.0, 1.5, 2.5], false);
  const status = statusFromLevel(Math.min(origemLevel, cacLevel));
  return {
    status,
    summary: `${formatPct(cur.origensRastreadasPct)} rastreado`,
  };
}

// --- Etapa T — TRÁFEGO -------------------------------------------------------
// Volume de leads + CPL — [CALIBRAR] (sem corte fixo na seção 8). CAC — [CALIBRAR] · etapas T/N.
function stageTrafego(studio: Studio, cur: AggregatedMetrics, r: DerivedRatios) {
  const refs = REFERENCE_RANGES[studio.operationModel];
  const metaLeadsImplicita = studio.metaMatriculasMes / 0.28;
  const volumeLevel = bandLevel(pct(cur.leads, metaLeadsImplicita), [110, 90, 70, 50]);
  const cplLevel = bandLevel(r.cpl, [refs.cpl.min * 0.85, refs.cpl.max, refs.cpl.max * 1.25, refs.cpl.max * 1.6], false);
  const cacLevel = bandLevel(r.cacMultiplo, [0.5, 1.0, 1.5, 2.5], false);
  const status = statusFromLevel(Math.min(volumeLevel, cplLevel, cacLevel));
  return {
    status,
    summary: `${cur.leads} leads · CPL ${formatCurrency(r.cpl)}`,
  };
}

// --- Etapa R — RESPOSTA -------------------------------------------------------
// Tempo de resposta — [SÓLIDO] · seção 8. No-show — [CALIBRAR] · seção 8.
function stageResposta(cur: AggregatedMetrics, r: DerivedRatios) {
  const tempoLevel = bandLevel(r.tempoResposta, [5, 15, 30, 60], false);
  const noShowLevel = bandLevel(r.noShowPct, [5, 10, 15, 20], false);
  const status = statusFromLevel(Math.min(tempoLevel, noShowLevel));
  return {
    status,
    summary: `Resposta ${cur.tempoRespostaMedioMin} min · No-show ${formatPct(cur.taxaNoShowPct, 1)}`,
  };
}

// --- Etapa O² — OPERAÇÃO -------------------------------------------------------
// Conversão experimental → matrícula — [SÓLIDO] · seção 8.
function stageOperacao(r: DerivedRatios) {
  const level = bandLevel(r.conversaoExperimental, [70, 60, 50, 40]);
  return {
    status: statusFromLevel(level),
    summary: `${formatPct(r.conversaoExperimental)} conversão experimental`,
  };
}

// --- Etapa L — LONGEVIDADE -------------------------------------------------------
// Churn — [CALIBRAR] · seção 8. LTV:CAC — [CALIBRAR] · etapas L/N.
function stageLongevidade(cur: AggregatedMetrics, r: DerivedRatios) {
  // TODO: a "leitura da queda de frequência" da seção 3.1 depende de dados de
  // presença por aluno, que ainda não fazem parte dos campos semanais da
  // seção 6. Por ora a etapa L usa churn + LTV:CAC; quando a frequência por
  // aluno entrar no lançamento semanal, cruzar também aqui.
  const churnLevel = bandLevel(r.churnPct, [3, 5, 7, 10], false);
  const ltvCacLevel = bandLevel(r.ltvCac, [5, 3, 2, 1]);
  const status = statusFromLevel(Math.min(churnLevel, ltvCacLevel));
  return {
    status,
    summary: `Churn ${formatPct(cur.churnPct, 1)} · CAC ${formatCurrency(r.cac)}`,
  };
}

export interface ComputedStage {
  letter: ControlLetter;
  display: string;
  key: string;
  name: string;
  phase: string;
  derivedFrom: string;
  anchorId: string;
  status: StatusKey;
  summary: string;
}

export function computeStageStatuses(
  studio: Studio,
  cur: AggregatedMetrics,
  prev?: AggregatedMetrics,
  season: SeasonKind = "normal"
): ComputedStage[] {
  const r = computeRatios(studio, cur, prev);

  const byLetter: Record<ControlLetter, { status: StatusKey; summary: string }> = {
    C: stageContexto(studio, cur, r, season),
    O1: stageOferta(r, Boolean(prev)),
    N: stageNumeros(cur, r),
    T: stageTrafego(studio, cur, r),
    R: stageResposta(cur, r),
    O2: stageOperacao(r),
    L: stageLongevidade(cur, r),
  };

  return CONTROL_LETTER_ORDER.map((letter) => {
    const meta = CONTROL_STAGE_META[letter];
    const computed = byLetter[letter];
    return {
      letter,
      display: meta.display,
      key: meta.key,
      name: meta.name,
      phase: meta.phase,
      derivedFrom: meta.derivedFrom,
      anchorId: meta.anchorId,
      status: computed.status,
      summary: computed.summary,
    };
  });
}

// ---------------------------------------------------------------------------
// 3.2 / 8 — Indicadores prioritários, com os cortes exatos da seção 8.
// ---------------------------------------------------------------------------
export function computePriorityIndicators(
  studio: Studio,
  cur: AggregatedMetrics,
  prev?: AggregatedMetrics,
  season: SeasonKind = "normal"
): ComputedIndicator[] {
  const refs = REFERENCE_RANGES[studio.operationModel];
  const r = computeRatios(studio, cur, prev);

  const receitaTrend = r.crescimentoReceitaPct !== undefined
    ? `${r.crescimentoReceitaPct >= 0 ? "+" : ""}${r.crescimentoReceitaPct.toFixed(1)}% vs. período anterior`
    : undefined;

  const matriculasRatioAdj = seasonalAdjust(r.matriculasRatio, season);
  const crescimentoAdj = r.crescimentoReceitaPct !== undefined ? seasonalAdjust(r.crescimentoReceitaPct, season) : undefined;
  const ocupacaoAdj = seasonalAdjust(r.ocupacaoPct, season);

  const indicators: ComputedIndicator[] = [
    {
      id: "matriculas-vs-meta",
      label: "Matrículas realizadas vs. meta",
      value: `${cur.matriculasRealizadas}/${studio.metaMatriculasMes}`,
      rawValue: r.matriculasRatio,
      status: capSeasonalStatus(statusFromLevel(bandLevel(matriculasRatioAdj, [110, 100, 90, 75])), season),
      stageLabel: "C",
      stages: ["C"],
      reference: "≥110% excelente · 100-109% bom · 90-99% estável · 75-89% atenção · <75% crítico",
      base: "calibrar",
    },
    {
      id: "receita-mensal",
      label: "Receita mensal",
      value: formatCurrency(cur.receitaMensal),
      rawValue: cur.receitaMensal,
      status: "estavel",
      stageLabel: "",
      stages: [],
      reference: "faturamento consolidado do período",
      base: "informativo",
      trend: receitaTrend,
    },
    {
      id: "crescimento-receita",
      label: "Crescimento mensal (receita)",
      value: crescimentoAdj === undefined ? "—" : `${r.crescimentoReceitaPct! >= 0 ? "+" : ""}${r.crescimentoReceitaPct!.toFixed(1)}%`,
      rawValue: r.crescimentoReceitaPct ?? 0,
      status:
        crescimentoAdj === undefined
          ? "estavel"
          : capSeasonalStatus(statusFromLevel(bandLevel(crescimentoAdj, [10, 5, 0, -5])), season),
      stageLabel: "",
      stages: [],
      reference: "≥10% excelente · 5-9% bom · 0-4% estável · -5-0% atenção · <-5% crítico (YoY quando houver histórico)",
      base: "calibrar",
    },
    {
      id: "margem",
      label: "Lucro líquido / Margem",
      value: `${r.margemPct.toFixed(1)}%`,
      rawValue: r.margemPct,
      status: statusFromLevel(bandLevel(r.margemPct, [35, 25, 20, 10])),
      stageLabel: "",
      stages: [],
      reference: "≥35% excelente · 25-34% bom · 20-24% estável · 10-19% atenção · <10% crítico",
      base: "solido",
    },
    {
      id: "mrr",
      label: "MRR",
      value: formatCurrency(cur.receitaMensal),
      rawValue: cur.receitaMensal,
      status: "estavel",
      stageLabel: "L",
      stages: ["L"],
      reference: "receita recorrente de planos ativos",
      base: "informativo",
    },
    {
      id: "ticket-medio",
      label: "Ticket médio",
      value: formatCurrency(r.ticketMedio),
      rawValue: r.ticketMedio,
      status: prev ? statusFromLevel(bandLevel(r.ticketDeltaPct, [1, 0, -1, -5])) : "estavel",
      stageLabel: "O1",
      stages: ["O1"],
      reference: `classificado pela tendência, não pelo valor — segmento (${OPERATION_MODEL_SHORT[studio.operationModel]}): ${formatCurrency(refs.ticketMedio.min)}-${formatCurrency(refs.ticketMedio.max)}`,
      base: "solido",
      trend: prev ? `${r.ticketDeltaPct >= 0 ? "+" : ""}${r.ticketDeltaPct.toFixed(1)}% vs. período anterior` : undefined,
    },
    {
      id: "leads-cpl",
      label: "Nº de leads / CPL",
      value: `${cur.leads} leads · ${formatCurrency(r.cpl)}`,
      rawValue: r.cpl,
      status: statusFromLevel(bandLevel(r.cpl, [refs.cpl.min * 0.85, refs.cpl.max, refs.cpl.max * 1.25, refs.cpl.max * 1.6], false)),
      stageLabel: "T",
      stages: ["T"],
      reference: `segmento (${OPERATION_MODEL_SHORT[studio.operationModel]}): ${formatCurrency(refs.cpl.min)}-${formatCurrency(refs.cpl.max)}`,
      base: "calibrar",
    },
    {
      id: "cac",
      label: "CAC",
      value: `${formatCurrency(r.cac)} · ${r.cacMultiplo.toFixed(1)}x mensalidade`,
      rawValue: r.cacMultiplo,
      status: statusFromLevel(bandLevel(r.cacMultiplo, [0.5, 1.0, 1.5, 2.5], false)),
      stageLabel: "T / N",
      stages: ["T", "N"],
      reference: "medido em múltiplo da mensalidade: ≤0,5x excelente · 0,5-1x bom · 1-1,5x estável · 1,5-2,5x atenção · >2,5x crítico",
      base: "calibrar",
    },
    {
      id: "tempo-resposta",
      label: "Tempo de resposta ao lead",
      value: `${cur.tempoRespostaMedioMin} min`,
      rawValue: cur.tempoRespostaMedioMin,
      status: statusFromLevel(bandLevel(r.tempoResposta, [5, 15, 30, 60], false)),
      stageLabel: "R",
      stages: ["R"],
      reference: "≤5min excelente · 5-15min bom · 15-30min estável · 30-60min atenção · >60min crítico",
      base: "solido",
    },
    {
      id: "no-show",
      label: "Taxa de no-show",
      value: formatPct(cur.taxaNoShowPct, 1),
      rawValue: cur.taxaNoShowPct,
      status: statusFromLevel(bandLevel(r.noShowPct, [5, 10, 15, 20], false)),
      stageLabel: "R",
      stages: ["R"],
      reference: "≤5% excelente · 5-10% bom · 10-15% estável · 15-20% atenção · >20% crítico",
      base: "calibrar",
    },
    {
      id: "conversao-experimental",
      label: "Conversão experimental → matrícula",
      value: formatPct(r.conversaoExperimental),
      rawValue: r.conversaoExperimental,
      status: statusFromLevel(bandLevel(r.conversaoExperimental, [70, 60, 50, 40])),
      stageLabel: "O2",
      stages: ["O2"],
      reference: "≥70% excelente · 60-69% bom · 50-59% estável · 40-49% atenção · <40% crítico",
      base: "solido",
    },
    {
      id: "churn",
      label: "Churn mensal",
      value: formatPct(cur.churnPct, 1),
      rawValue: cur.churnPct,
      status: statusFromLevel(bandLevel(r.churnPct, [3, 5, 7, 10], false)),
      stageLabel: "L",
      stages: ["L"],
      reference: "≤3% excelente · 3-5% bom · 5-7% estável · 7-10% atenção · >10% crítico",
      base: "calibrar",
    },
    {
      id: "ltv-cac",
      label: "LTV:CAC",
      value: `${formatCurrency(cur.ltv)} · ${r.ltvCac.toFixed(1)}x CAC`,
      rawValue: r.ltvCac,
      status: statusFromLevel(bandLevel(r.ltvCac, [5, 3, 2, 1])),
      stageLabel: "L / N",
      stages: ["L", "N"],
      reference: "≥5:1 excelente · 3-5:1 bom · 2-3:1 estável · 1-2:1 atenção · <1:1 crítico",
      base: "calibrar",
    },
    {
      id: "ocupacao",
      label: "Taxa de ocupação",
      value: formatPct(cur.ocupacaoPct),
      rawValue: cur.ocupacaoPct,
      status: capSeasonalStatus(statusFromLevel(bandLevel(ocupacaoAdj, [90, 80, 70, 65])), season),
      stageLabel: "Resultado (C+T+O+L)",
      stages: ["C", "T", "O2", "L"],
      isResult: true,
      reference: "≥90% excelente · 80-89% bom · 70-79% estável · 65-69% atenção · <65% crítico",
      base: "solido",
    },
    {
      id: "origens-rastreadas",
      label: "% origens rastreadas",
      value: formatPct(cur.origensRastreadasPct),
      rawValue: cur.origensRastreadasPct,
      status: statusFromLevel(threeTierLevel(r.origensRastreadasPct, 100, 80)),
      stageLabel: "N",
      stages: ["N"],
      reference: "100% saudável · 80-99% atenção · <80% crítico",
      base: "solido",
    },
    {
      id: "folha-custos",
      label: "% Folha sobre custos totais",
      value: formatPct(r.folhaPct, 1),
      rawValue: r.folhaPct,
      status: statusFromLevel(threeTierLevelInverse(r.folhaPct, 40, 50)),
      stageLabel: "",
      stages: [],
      reference: "≤40% saudável · 40-50% atenção · >50% crítico",
      base: "solido",
    },
    {
      id: "marketing-receita",
      label: "% Marketing sobre receita",
      value: formatPct(r.marketingPct, 1),
      rawValue: r.marketingPct,
      status: statusFromLevel(
        r.marketingPct < 5 ? 2 : r.marketingPct <= 10 ? 4 : r.marketingPct <= 15 ? 3 : 2
      ),
      stageLabel: "T",
      stages: ["T"],
      reference: "5-10% ideal · <5% subinvestindo (atenção) · >15% ineficiência/CAC alto (atenção)",
      base: "solido",
    },
  ];

  return indicators;
}

export interface StageIndicatorGroup {
  letter: ControlLetter;
  indicators: ComputedIndicator[];
}

// Agrupa os indicadores pela etapa que medem, na ordem C.O.N.T.R.O.L — usado
// na página Indicadores. Indicadores-resultado (ocupação) e indicadores sem
// etapa (receita, margem) ficam de fora dos grupos e são tratados à parte.
export function groupIndicatorsByStage(indicators: ComputedIndicator[]): StageIndicatorGroup[] {
  return CONTROL_LETTER_ORDER.map((letter) => ({
    letter,
    indicators: indicators.filter((ind) => !ind.isResult && ind.stages.includes(letter)),
  })).filter((group) => group.indicators.length > 0);
}

export function generalIndicators(indicators: ComputedIndicator[]): ComputedIndicator[] {
  return indicators.filter((ind) => !ind.isResult && ind.stages.length === 0);
}

export function resultIndicators(indicators: ComputedIndicator[]): ComputedIndicator[] {
  return indicators.filter((ind) => ind.isResult);
}

// ---------------------------------------------------------------------------
// 4. Insights da Central — leitura automática: pontos fortes (bom/excelente)
// e pontos de atenção (atenção/crítico), sempre nomeando a letra.
// ---------------------------------------------------------------------------
export interface CentralInsight {
  letter: ControlLetter;
  display: string;
  name: string;
  status: StatusKey;
  summary: string;
}

export function computeCentralInsights(stages: ComputedStage[]) {
  const strengths: CentralInsight[] = [];
  const attentions: CentralInsight[] = [];
  for (const stage of stages) {
    const entry: CentralInsight = {
      letter: stage.letter,
      display: stage.display,
      name: stage.name,
      status: stage.status,
      summary: stage.summary,
    };
    if (stage.status === "bom" || stage.status === "excelente") strengths.push(entry);
    else if (stage.status === "atencao" || stage.status === "critico") attentions.push(entry);
  }
  return { strengths, attentions };
}

// ---------------------------------------------------------------------------
// Página Insights — um cartão por indicador em atenção/crítico, com
// diagnóstico (valor vs. referência) e a recomendação amarrada à etapa
// C.O.N.T.R.O.L correspondente (nunca um número solto). Usado como fallback
// para o que o motor de diagnóstico (lib/diagnostic-engine.ts) não cobrir.
// ---------------------------------------------------------------------------
export interface IndicatorInsight {
  id: string;
  title: string;
  status: StatusKey;
  diagnosis: string;
  recommendation: string;
  stageLetters: ControlLetter[];
  stageNames: string;
}

export function buildIndicatorInsights(indicators: ComputedIndicator[]): IndicatorInsight[] {
  return indicators
    .filter((ind) => ind.base !== "informativo" && (ind.status === "atencao" || ind.status === "critico"))
    .map((ind) => {
      const stageNames = ind.stages.map((letter) => CONTROL_STAGE_META[letter].name).join(" / ");
      const primaryStage = ind.stages[0] ? CONTROL_STAGE_META[ind.stages[0]] : undefined;
      return {
        id: ind.id,
        title: `${ind.label}: ${ind.value}`,
        status: ind.status,
        diagnosis: `Referência: ${ind.reference}.${ind.isResult ? " Este é um indicador-resultado: a causa está em uma das etapas que o alimentam, não nele mesmo." : ""}`,
        recommendation: primaryStage
          ? `Trabalhar a etapa ${primaryStage.name.toUpperCase()} (${primaryStage.display}): ${primaryStage.resolves}.`
          : "Revisar este número no próximo fechamento — ainda sem etapa associada.",
        stageLetters: ind.stages,
        stageNames: stageNames || "—",
      };
    });
}

export { worseStatus };
