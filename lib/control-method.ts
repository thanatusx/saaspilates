// Primitivas do método C.O.N.T.R.O.L (status, cores, metadados fixos das 7
// etapas). Os números de cada studio ficam em lib/studios-data.ts; o cálculo
// de qual status cada etapa recebe fica em lib/control-engine.ts — este
// arquivo só descreve "o que é" o método, não "como está" um studio.

export type StatusKey = "excelente" | "bom" | "estavel" | "atencao" | "critico";

export const STATUS_LABEL: Record<StatusKey, string> = {
  excelente: "Excelente",
  bom: "Bom",
  estavel: "Estável",
  atencao: "Atenção",
  critico: "Crítico",
};

// Paleta de status (fixa, nunca reaproveitada para outra coisa) — usa os
// tokens FK definidos em app/globals.css (--ok/--warn/--bad/--info), com
// variantes claro/escuro automáticas.
export const STATUS_COLOR: Record<StatusKey, { text: string; bg: string; dot: string; border: string }> = {
  excelente: { text: "text-(--ok)", bg: "bg-(--ok-wash)", dot: "bg-(--ok)", border: "border-(--ok)" },
  bom: { text: "text-(--ok)", bg: "bg-(--ok-wash)", dot: "bg-(--ok)", border: "border-(--ok)" },
  estavel: { text: "text-(--info)", bg: "bg-(--info-wash)", dot: "bg-(--info)", border: "border-(--info)" },
  atencao: { text: "text-(--warn)", bg: "bg-(--warn-wash)", dot: "bg-(--warn)", border: "border-(--warn)" },
  critico: { text: "text-(--bad)", bg: "bg-(--bad-wash)", dot: "bg-(--bad)", border: "border-(--bad)" },
};

// 0 a 5: quantos blocos do medidor ficam preenchidos.
export const STATUS_LEVEL: Record<StatusKey, number> = {
  critico: 1,
  atencao: 2,
  estavel: 3,
  bom: 4,
  excelente: 5,
};

// Ordem de severidade para comparar dois status e ficar com o pior/melhor.
const STATUS_BY_LEVEL: StatusKey[] = ["critico", "atencao", "estavel", "bom", "excelente"];

export function worseStatus(a: StatusKey, b: StatusKey): StatusKey {
  return STATUS_LEVEL[a] <= STATUS_LEVEL[b] ? a : b;
}

// `level` é 1-5 (1 = crítico … 5 = excelente), o mesmo range que bandLevel()
// e STATUS_LEVEL usam — nunca 0-indexado.
export function statusFromLevel(level: number): StatusKey {
  const clamped = Math.max(1, Math.min(STATUS_BY_LEVEL.length, Math.round(level)));
  return STATUS_BY_LEVEL[clamped - 1];
}

export type ControlLetter = "C" | "O1" | "N" | "T" | "R" | "O2" | "L";

export interface ControlStageMeta {
  letter: ControlLetter;
  display: string; // o que aparece no card grande (C, O¹, N, T, R, O², L)
  key: string; // CONTEXTO, OFERTA, etc.
  name: string;
  phase: "Fundação" | "Aquisição" | "Conversão" | "Sustentação";
  resolves: string;
  derivedFrom: string; // texto curto do que alimenta o semáforo (tabela 3.1)
  anchorId: string;
}

export const CONTROL_STAGE_META: Record<ControlLetter, ControlStageMeta> = {
  C: {
    letter: "C",
    display: "C",
    key: "CONTEXTO",
    name: "Contexto",
    phase: "Fundação",
    resolves: "Anamnese, ocupação por horário, Cliente Ideal e meta de matrículas/mês",
    derivedFrom: "Matrículas realizadas vs. meta/mês + preenchimento da ocupação por horário",
    anchorId: "contexto",
  },
  O1: {
    letter: "O1",
    display: "O¹",
    key: "OFERTA",
    name: "Oferta",
    phase: "Fundação",
    resolves: "Posicionamento, experimental como isca, planos escalonados, criativos (G.C.C)",
    derivedFrom: "Tendência do ticket médio (queda = guerra de preço)",
    anchorId: "oferta",
  },
  N: {
    letter: "N",
    display: "N",
    key: "NUMEROS",
    name: "Números",
    phase: "Fundação",
    resolves: "Pixel + API, rastreio de origens, painel de CPL/CAC/ocupação (técnica REWIND)",
    derivedFrom: "% de matrículas com origem rastreada",
    anchorId: "numeros",
  },
  T: {
    letter: "T",
    display: "T",
    key: "TRAFEGO",
    name: "Tráfego",
    phase: "Aquisição",
    resolves: "Meta e Google Ads, funil O.O.P.A, segmentação por raio/intenção",
    derivedFrom: "Volume de leads/oportunidades + CPL/CAC",
    anchorId: "trafego",
  },
  R: {
    letter: "R",
    display: "R",
    key: "RESPOSTA",
    name: "Resposta",
    phase: "Aquisição",
    resolves: "CRM Franko + S.O.F.I.A, atendimento em <5 min, follow-up",
    derivedFrom: "Tempo médio de resposta ao lead + taxa de no-show",
    anchorId: "resposta",
  },
  O2: {
    letter: "O2",
    display: "O²",
    key: "OPERACAO",
    name: "Operação",
    phase: "Conversão",
    resolves: "Script de vendas, treinamento do dono/instrutores, ancoragem",
    derivedFrom: "Conversão experimental → matrícula",
    anchorId: "operacao",
  },
  L: {
    letter: "L",
    display: "L",
    key: "LONGEVIDADE",
    name: "Longevidade",
    phase: "Sustentação",
    resolves: "Réguas de estímulo, remarketing, reativação de ex-alunos",
    derivedFrom: "Churn + leitura da queda de frequência",
    anchorId: "longevidade",
  },
};

export const CONTROL_LETTER_ORDER: ControlLetter[] = ["C", "O1", "N", "T", "R", "O2", "L"];
