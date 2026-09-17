import { OriginChannel, OriginCounts, Studio, StudioRecord, WEEK_LABELS, WeeklyEntry } from "./types";

// Dados mock — em produção isto vem do banco, lançado semana a semana pela
// tela "Lançar Dados" (seção 6). Para não ter que escrever 4 números à mão
// por campo por semana, um mês é descrito como TOTAIS + pesos de distribuição
// entre as 4 semanas, e splitWeighted() garante que a soma bate exatamente
// com o total (importante para bater com a meta/mês e com origem = matrículas).

function splitWeighted(total: number, weights: [number, number, number, number]): [number, number, number, number] {
  const sumW = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sumW);
  const floors = raw.map(Math.floor);
  const remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder; k++) result[order[k % 4].i] += 1;
  return result as [number, number, number, number];
}

interface MonthRecipe {
  weights: [number, number, number, number]; // distribuição relativa entre S01-S04
  receitaTotal: number;
  custosTotal: { folha: number; aluguel: number; marketing: number; outros: number };
  matriculasTotal: number;
  cancelamentosTotal: number;
  leadsTotal: number;
  investimentoMidiaTotal: number;
  experimentaisAgendadasTotal: number;
  noShowsTotal: number;
  tempoRespostaMedioMin: number; // constante nas 4 semanas (variação pequena)
  capacidadeVagas: number; // constante nas 4 semanas
  origemTotal: OriginCounts; // soma deve ser <= matriculasTotal
  alunosAtivosInicio: number; // estoque antes da primeira semana do mês
}

function buildMonth(periodId: string, recipe: MonthRecipe): WeeklyEntry[] {
  const matriculas = splitWeighted(recipe.matriculasTotal, recipe.weights);
  const cancelamentos = splitWeighted(recipe.cancelamentosTotal, recipe.weights);
  const receita = splitWeighted(recipe.receitaTotal, recipe.weights);
  const leads = splitWeighted(recipe.leadsTotal, recipe.weights);
  const investimentoMidia = splitWeighted(recipe.investimentoMidiaTotal, recipe.weights);
  const experimentaisAgendadas = splitWeighted(recipe.experimentaisAgendadasTotal, recipe.weights);
  const noShows = splitWeighted(recipe.noShowsTotal, recipe.weights);
  const folha = splitWeighted(recipe.custosTotal.folha, recipe.weights);
  const aluguel = splitWeighted(recipe.custosTotal.aluguel, recipe.weights);
  const marketing = splitWeighted(recipe.custosTotal.marketing, recipe.weights);
  const outros = splitWeighted(recipe.custosTotal.outros, recipe.weights);

  const origemPorCanal: Partial<Record<OriginChannel, [number, number, number, number]>> = {};
  for (const [channel, total] of Object.entries(recipe.origemTotal) as [OriginChannel, number][]) {
    origemPorCanal[channel] = splitWeighted(total, recipe.weights);
  }

  let alunosAtivos = recipe.alunosAtivosInicio;
  const weeks: WeeklyEntry[] = WEEK_LABELS.map((week, i) => {
    alunosAtivos = alunosAtivos + matriculas[i] - cancelamentos[i];
    const experimentaisRealizadas = Math.max(experimentaisAgendadas[i] - noShows[i], 0);
    const origem: OriginCounts = {};
    for (const channel of Object.keys(origemPorCanal) as OriginChannel[]) {
      origem[channel] = origemPorCanal[channel]![i];
    }
    return {
      id: `${periodId}-${week}`,
      periodId,
      week,
      receita: receita[i],
      custos: { folha: folha[i], aluguel: aluguel[i], marketing: marketing[i], outros: outros[i] },
      alunosAtivosFim: alunosAtivos,
      matriculasNovas: matriculas[i],
      cancelamentos: cancelamentos[i],
      leadsRecebidos: leads[i],
      tempoRespostaMedioMin: recipe.tempoRespostaMedioMin,
      experimentaisAgendadas: experimentaisAgendadas[i],
      experimentaisRealizadas,
      noShows: noShows[i],
      investimentoMidia: investimentoMidia[i],
      origem,
      capacidadeVagas: recipe.capacidadeVagas,
    };
  });
  return weeks;
}

const STUDIOS: Studio[] = [
  {
    id: "movimento-pilates",
    name: "Studio Movimento Pilates",
    city: "São Paulo, SP",
    operationModel: "grupo",
    metaMatriculasMes: 25,
    plan: "Plano Pro",
    createdAt: "2024-02-10",
  },
  {
    id: "corpo-consciente",
    name: "Corpo Consciente Pilates",
    city: "Belo Horizonte, MG",
    operationModel: "boutique",
    metaMatriculasMes: 14,
    plan: "Plano Essencial",
    createdAt: "2024-05-02",
  },
  {
    id: "elevare-clinica",
    name: "Elevare Clínica + Pilates",
    city: "Curitiba, PR",
    operationModel: "clinica",
    metaMatriculasMes: 20,
    plan: "Plano Enterprise",
    createdAt: "2023-11-20",
  },
];

// --- Studio Movimento Pilates ---------------------------------------------
// Estável, com pontos de atenção em Oferta e Operação.
const movimentoJulho = buildMonth("2024-07", {
  weights: [1.1, 0.85, 1.2, 0.85],
  receitaTotal: 47610,
  custosTotal: { folha: 17500, aluguel: 6000, marketing: 7350, outros: 6000 },
  matriculasTotal: 23,
  cancelamentosTotal: 6,
  leadsTotal: 70,
  investimentoMidiaTotal: 6800,
  experimentaisAgendadasTotal: 57,
  noShowsTotal: 6,
  tempoRespostaMedioMin: 8,
  capacidadeVagas: 200,
  origemTotal: { "Instagram / tráfego pago": 9, Indicação: 6, Google: 5, Agregadores: 3 },
  alunosAtivosInicio: 143,
});

const movimentoAgosto = buildMonth("2024-08", {
  weights: [1.1, 0.9, 1.25, 0.7],
  receitaTotal: 49000,
  custosTotal: { folha: 18000, aluguel: 6000, marketing: 8500, outros: 6798 },
  matriculasTotal: 25,
  cancelamentosTotal: 7,
  leadsTotal: 89,
  investimentoMidiaTotal: 7800,
  experimentaisAgendadasTotal: 70,
  noShowsTotal: 8,
  tempoRespostaMedioMin: 9,
  capacidadeVagas: 205,
  origemTotal: { "Instagram / tráfego pago": 11, Indicação: 7, Google: 4, Agregadores: 3 },
  alunosAtivosInicio: movimentoJulho[3].alunosAtivosFim,
});

// --- Corpo Consciente Pilates ----------------------------------------------
// Studio pequeno (boutique), abaixo da meta, CPL alto e churn alto.
const corpoJulho = buildMonth("2024-07", {
  weights: [0.9, 1.1, 0.9, 1.1],
  receitaTotal: 27950,
  custosTotal: { folha: 12000, aluguel: 4500, marketing: 3600, outros: 2800 },
  matriculasTotal: 9,
  cancelamentosTotal: 5,
  leadsTotal: 30,
  investimentoMidiaTotal: 3600,
  experimentaisAgendadasTotal: 22,
  noShowsTotal: 4,
  tempoRespostaMedioMin: 18,
  capacidadeVagas: 90,
  origemTotal: { Indicação: 6, "Instagram / tráfego pago": 2 },
  alunosAtivosInicio: 46,
});

const corpoAgosto = buildMonth("2024-08", {
  weights: [1.2, 0.6, 0.9, 1.3],
  receitaTotal: 27300,
  custosTotal: { folha: 12500, aluguel: 4500, marketing: 4200, outros: 2500 },
  matriculasTotal: 8,
  cancelamentosTotal: 6,
  leadsTotal: 34,
  investimentoMidiaTotal: 4200,
  experimentaisAgendadasTotal: 23,
  noShowsTotal: 5,
  tempoRespostaMedioMin: 22,
  capacidadeVagas: 90,
  origemTotal: { Indicação: 5, "Instagram / tráfego pago": 2 },
  alunosAtivosInicio: corpoJulho[3].alunosAtivosFim,
});

// --- Elevare Clínica + Pilates ----------------------------------------------
// Studio maduro (clínica), a maior parte em bom/excelente.
const elevareJulho = buildMonth("2024-07", {
  weights: [1, 0.85, 1.2, 0.95],
  receitaTotal: 65280,
  custosTotal: { folha: 26000, aluguel: 9500, marketing: 4600, outros: 6050 },
  matriculasTotal: 19,
  cancelamentosTotal: 3,
  leadsTotal: 52,
  investimentoMidiaTotal: 4600,
  experimentaisAgendadasTotal: 40,
  noShowsTotal: 4,
  tempoRespostaMedioMin: 5,
  capacidadeVagas: 178,
  origemTotal: { "Parcerias médicas": 8, Google: 5, "Instagram / tráfego pago": 4, Agregadores: 2 },
  alunosAtivosInicio: 120,
});

const elevareAgosto = buildMonth("2024-08", {
  weights: [1.1, 0.9, 1.15, 0.85],
  receitaTotal: 68600,
  custosTotal: { folha: 26500, aluguel: 9500, marketing: 5000, outros: 7020 },
  matriculasTotal: 21,
  cancelamentosTotal: 3,
  leadsTotal: 58,
  investimentoMidiaTotal: 5000,
  experimentaisAgendadasTotal: 44,
  noShowsTotal: 4,
  tempoRespostaMedioMin: 4,
  capacidadeVagas: 178,
  origemTotal: { "Parcerias médicas": 9, Google: 6, "Instagram / tráfego pago": 4, Agregadores: 2 },
  alunosAtivosInicio: elevareJulho[3].alunosAtivosFim,
});

export const STUDIO_RECORDS: Record<string, StudioRecord> = {
  "movimento-pilates": { studio: STUDIOS[0], weeks: [...movimentoJulho, ...movimentoAgosto] },
  "corpo-consciente": { studio: STUDIOS[1], weeks: [...corpoJulho, ...corpoAgosto] },
  "elevare-clinica": { studio: STUDIOS[2], weeks: [...elevareJulho, ...elevareAgosto] },
};

export function listStudios(): Studio[] {
  return Object.values(STUDIO_RECORDS).map((r) => r.studio);
}

export function getStudioRecord(studioId: string): StudioRecord | undefined {
  return STUDIO_RECORDS[studioId];
}

export const DEFAULT_STUDIO_ID = "movimento-pilates";
