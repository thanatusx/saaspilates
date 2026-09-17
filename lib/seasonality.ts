import { StatusKey } from "./control-method";

// ---------------------------------------------------------------------------
// 8.1 Camada de sazonalidade (obrigatória).
// PICO: jan/fev (retomada) — metas mais altas, queda aqui é mais grave.
// VALE: jul/dez (férias/festas) — queda esperada, nunca dispara Crítico
// automático.
// Aplicada apenas aos indicadores de FLUXO citados na seção 8.1: receita
// (crescimento), novos alunos (matrículas vs. meta) e ocupação. Indicadores
// operacionais/de qualidade (resposta, no-show, conversão, CAC, churn...)
// não sofrem ajuste sazonal — um no-show alto é um no-show alto em qualquer mês.
// ---------------------------------------------------------------------------

export type SeasonKind = "pico" | "vale" | "normal";

export function seasonForMonth(periodId: string): SeasonKind {
  const month = Number(periodId.split("-")[1]);
  if (month === 1 || month === 2) return "pico";
  if (month === 7 || month === 12) return "vale";
  return "normal";
}

export const SEASON_LABEL: Record<SeasonKind, string> = {
  pico: "Pico (retomada)",
  vale: "Vale (férias/festas)",
  normal: "Mês regular",
};

// Pontos percentuais somados ao valor bruto ANTES de bandear — em vale,
// afrouxa (soma pontos); em pico, aperta (subtrai pontos). Nunca muda o
// número exibido ao usuário, só a régua de classificação.
const SEASONAL_BONUS: Record<SeasonKind, number> = {
  pico: -8,
  vale: 15,
  normal: 0,
};

export function seasonalAdjust(value: number, season: SeasonKind): number {
  return value + SEASONAL_BONUS[season];
}

// Trava literal da seção 8.1: "queda em jul/dez não gera Crítico automático".
// Mesmo que o ajuste acima não tenha sido suficiente, o vale nunca classifica
// um indicador de fluxo como Crítico.
export function capSeasonalStatus(status: StatusKey, season: SeasonKind): StatusKey {
  if (season === "vale" && status === "critico") return "atencao";
  return status;
}

// Para quando houver ≥12 meses de histórico: acha o mesmo mês do ano
// anterior. Com o mock atual (2 meses) isso nunca resolve — a função já fica
// pronta para quando o histórico crescer, caindo de volta pro mês anterior
// (mesma lógica de hoje) enquanto não houver dado YoY.
export function yoyPeriodId(periodId: string): string {
  const [year, month] = periodId.split("-");
  return `${Number(year) - 1}-${month}`;
}
