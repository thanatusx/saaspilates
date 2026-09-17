import { ComputedIndicator, ComputedStage, DerivedRatios } from "./control-engine";
import { ControlLetter, StatusKey } from "./control-method";
import { SeasonKind } from "./seasonality";

// ---------------------------------------------------------------------------
// 9.1 — Motor de diagnóstico: o diferencial da FK. Não lista status solto,
// CRUZA indicadores e aponta a causa provável + a etapa certa + a ação.
//
// As faixas usadas aqui (ocupação <70%/<65%, conversão <40%/≥50%, no-show
// ≥15%, CAC-múltiplo >1,5x, churn ≥7%...) são exatamente os cortes da seção 8
// — para não divergir, a ocupação e as matrículas-vs-meta são lidas direto
// dos indicadores já calculados em control-engine (com sazonalidade
// aplicada), nunca recalculadas aqui.
//
// Cobertura: das 11 combinações da tabela, 9 são detectadas automaticamente.
// Fica de fora (documentada, não implementada por falta de sinal no modelo
// de dados atual):
//  - "Volume de leads ok mas desqualificados (não é o Cliente Ideal)":
//    precisaria de um campo de qualificação do lead/aderência ao Cliente
//    Ideal, que a seção 6 ainda não captura.
// A combinação de sazonalidade (vale) é tratada à parte, como nota
// contextual, não como "problema" na lista de findings.
// ---------------------------------------------------------------------------

export interface DiagnosticFinding {
  id: string;
  title: string; // rótulo curto do achado (cabeçalho do card)
  diagnosis: string; // frase em linguagem de gestor
  stageLetters: ControlLetter[];
  stageLabel: string; // ex.: "T — TRÁFEGO" ou "N — NÚMEROS → T — TRÁFEGO"
  action: string;
  severity: StatusKey; // pior status entre os indicadores que geraram o achado
}

const SEVERITY_ORDER: StatusKey[] = ["critico", "atencao", "estavel", "bom", "excelente"];
function worse(a: StatusKey, b: StatusKey): StatusKey {
  return SEVERITY_ORDER.indexOf(a) <= SEVERITY_ORDER.indexOf(b) ? a : b;
}
const isBad = (s: StatusKey) => s === "atencao" || s === "critico";
const isHealthy = (s: StatusKey) => !isBad(s);

function findIndicator(indicators: ComputedIndicator[], id: string): ComputedIndicator | undefined {
  return indicators.find((i) => i.id === id);
}

function findStage(stages: ComputedStage[], letter: ControlLetter): ComputedStage | undefined {
  return stages.find((s) => s.letter === letter);
}

export function runDiagnosticEngine(
  ratios: DerivedRatios,
  indicators: ComputedIndicator[],
  stages: ComputedStage[],
  season: SeasonKind
): { findings: DiagnosticFinding[]; seasonalNote?: string } {
  const r = ratios;
  const findings: DiagnosticFinding[] = [];

  const ocupacaoStatus = findIndicator(indicators, "ocupacao")?.status ?? "estavel";
  const matriculasStatus = findIndicator(indicators, "matriculas-vs-meta")?.status ?? "estavel";
  const conversaoStatus = findIndicator(indicators, "conversao-experimental")?.status ?? "estavel";
  const noShowStatus = findIndicator(indicators, "no-show")?.status ?? "estavel";
  const cacStatus = findIndicator(indicators, "cac")?.status ?? "estavel";
  const churnStatus = findIndicator(indicators, "churn")?.status ?? "estavel";
  const trafegoStage = findStage(stages, "T");
  const respostaStage = findStage(stages, "R");
  const ofertaStage = findStage(stages, "O1");

  // 1. Ocupação baixa + conversão boa (≥50%) → T — TRÁFEGO
  if (isBad(ocupacaoStatus) && r.conversaoExperimental >= 50) {
    findings.push({
      id: "topo-funil-fraco",
      title: "Faltam oportunidades no topo do funil",
      diagnosis: `A ocupação está em ${r.ocupacaoPct.toFixed(0)}% (${ocupacaoStatus}), mas a conversão da experimental está em ${r.conversaoExperimental.toFixed(0)}% — boa. O problema não é o studio: chegam poucas pessoas para experimentar.`,
      stageLetters: ["T"],
      stageLabel: "T — TRÁFEGO",
      action: "Ligar/escalar captação local no Meta e Google (funil O.O.P.A), com campanhas para preencher o horário morto.",
      severity: worse(ocupacaoStatus, "estavel"),
    });
  }

  // 2. Muitos leads + poucas experimentais agendadas → R — RESPOSTA (gargalo de atendimento)
  const agendamentoBaixo = r.agendamentoRate < 45; // [CALIBRAR] — sem corte fixo na seção 8
  if (trafegoStage && (trafegoStage.status === "bom" || trafegoStage.status === "excelente") && agendamentoBaixo) {
    findings.push({
      id: "gargalo-atendimento",
      title: "Gargalo de atendimento",
      diagnosis: `Os leads estão chegando bem, mas só ${r.agendamentoRate.toFixed(0)}% viram experimental agendada — o lead esfria antes do agendamento.`,
      stageLetters: ["R"],
      stageLabel: "R — RESPOSTA",
      action: "Ativar CRM Franko + S.O.F.I.A para responder em <5 min, com follow-up e confirmação da experimental.",
      severity: "atencao",
    });
  }

  // 3. No-show alto + experimentais agendadas ok → R — RESPOSTA (confirmação)
  if (isBad(noShowStatus) && !agendamentoBaixo) {
    findings.push({
      id: "no-show-alto",
      title: "No-show alto",
      diagnosis: `A taxa de no-show está em ${r.noShowPct.toFixed(1)}% — o lead agenda, mas não comparece.`,
      stageLetters: ["R"],
      stageLabel: "R — RESPOSTA",
      action: "Régua de confirmação/lembrete via WhatsApp antes da aula experimental.",
      severity: noShowStatus,
    });
  }

  // 4. Ocupação baixa + conversão ruim (<40%) → O — OPERAÇÃO
  if (isBad(ocupacaoStatus) && r.conversaoExperimental < 40) {
    findings.push({
      id: "fechamento-fraco",
      title: "Falha de fechamento na experimental",
      diagnosis: `A ocupação está em ${r.ocupacaoPct.toFixed(0)}% e a conversão da experimental está em ${r.conversaoExperimental.toFixed(0)}% (crítico) — o studio recebe gente, mas não fecha. A experimental virou "apresentação simpática".`,
      stageLetters: ["O2"],
      stageLabel: "O — OPERAÇÃO",
      action: "Script de vendas, treinamento do dono e instrutores, ancoragem de planos e revisão dos atendimentos perdidos.",
      severity: "critico",
    });
  }

  // 5. Ticket em queda + volume estável → O — OFERTA
  if (ofertaStage && isBad(ofertaStage.status) && isHealthy(matriculasStatus)) {
    findings.push({
      id: "guerra-de-preco",
      title: "Ticket em queda — risco de guerra de preço",
      diagnosis: "O ticket médio está caindo enquanto o volume de matrículas segue estável — sinal de guerra de preço/desconto excessivo.",
      stageLetters: ["O1"],
      stageLabel: "O — OFERTA",
      action: "Rever posicionamento e ancoragem, planos escalonados, nicho e criativos (G.C.C) para defender o ticket.",
      severity: ofertaStage.status,
    });
  }

  // 6. CAC alto + conversão ok → N — NÚMEROS → T — TRÁFEGO
  if (isBad(cacStatus) && isHealthy(conversaoStatus)) {
    findings.push({
      id: "cac-alto",
      title: "CAC alto com conversão saudável",
      diagnosis: `O CAC está em ${r.cacMultiplo.toFixed(1)}x a mensalidade e a conversão está saudável — a mídia está cara ou mal segmentada, não é o studio.`,
      stageLetters: ["N", "T"],
      stageLabel: "N — NÚMEROS → T — TRÁFEGO",
      action: "Rastrear origem no painel de CPL/CAC, otimizar com REWIND e refinar a segmentação por raio/intenção.",
      severity: cacStatus,
    });
  }

  // 7. Origem não rastreada / campo vazio → N — NÚMEROS
  if (r.origensRastreadasPct < 100) {
    findings.push({
      id: "origem-nao-rastreada",
      title: "Origens não rastreadas",
      diagnosis: `${(100 - r.origensRastreadasPct).toFixed(0)}% das matrículas não têm origem lançada — o studio decide no achismo.`,
      stageLetters: ["N"],
      stageLabel: "N — NÚMEROS",
      action: "Instalar Pixel + API de Conversão e rastrear todas as origens antes de escalar verba.",
      severity: r.origensRastreadasPct < 80 ? "critico" : "atencao",
    });
  }

  // 9. Matrículas abaixo da meta + funil saudável → C — CONTEXTO
  if (isBad(matriculasStatus) && respostaStage && isHealthy(respostaStage.status) && isHealthy(conversaoStatus)) {
    findings.push({
      id: "meta-desalinhada",
      title: "Meta desalinhada ou capacidade subaproveitada",
      diagnosis: "As matrículas estão abaixo da meta, mas o funil (resposta, agendamento, conversão) está saudável — a meta pode estar desalinhada ou a capacidade está subaproveitada.",
      stageLetters: ["C"],
      stageLabel: "C — CONTEXTO",
      action: "Revisar a meta e a leitura de ocupação por horário na anamnese.",
      severity: matriculasStatus,
    });
  }

  // 10. Churn alto + ocupação ok → L — LONGEVIDADE
  if (isBad(churnStatus) && isHealthy(ocupacaoStatus)) {
    findings.push({
      id: "retencao-fraca",
      title: "Churn alto — problema de retenção",
      diagnosis: `O churn está em ${r.churnPct.toFixed(1)}% mesmo com a ocupação saudável — problema de retenção, não de captação.`,
      stageLetters: ["L"],
      stageLabel: "L — LONGEVIDADE",
      action: "Réguas de estímulo, reativação de ex-alunos e leitura da queda de frequência.",
      severity: churnStatus,
    });
  }

  // 11. Queda de receita em mês de vale → nota sazonal, não alarme.
  let seasonalNote: string | undefined;
  if (season === "vale" && r.crescimentoReceitaPct !== undefined && r.crescimentoReceitaPct < 0) {
    seasonalNote =
      "A queda de receita deste mês é esperada (período de vale — férias/festas) e não deve ser tratada como alarme. Aproveite para investir em campanhas de horário morto (T — TRÁFEGO) e reativação de ex-alunos (L — LONGEVIDADE).";
  }

  findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return { findings, seasonalNote };
}
