// ---------------------------------------------------------------------------
// Período do CRM — por data de calendário real, diferente do sistema de
// semanas S01-S04 de lib/period.ts (que é usado pelo lançamento de dados e
// pelo Painel C.O.N.T.R.O.L). Aqui "hoje" é o dia de hoje de verdade: os
// leads são datados em tempo real, não um dataset congelado.
// ---------------------------------------------------------------------------
export type CrmPeriodPreset = "hoje" | "ontem" | "semana" | "quinzena" | "mes" | "anterior" | "tudo" | "custom";

export const CRM_PERIOD_LABEL: Record<CrmPeriodPreset, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "7 dias",
  quinzena: "14 dias",
  mes: "Este mês",
  anterior: "Mês passado",
  tudo: "Tudo",
  custom: "Personalizado",
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** since/until (YYYY-MM-DD) para o preset de período do CRM. */
export function crmPeriodRange(preset: CrmPeriodPreset, customFrom?: string, customTo?: string): { since: string; until: string } {
  const today = toISODate(new Date());

  switch (preset) {
    case "hoje":
      return { since: today, until: today };
    case "ontem": {
      const y = shiftDays(today, -1);
      return { since: y, until: y };
    }
    case "semana":
      return { since: shiftDays(today, -6), until: today };
    case "quinzena":
      return { since: shiftDays(today, -13), until: today };
    case "mes":
      return { since: `${today.slice(0, 8)}01`, until: today };
    case "anterior": {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      const ini = toISODate(d);
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { since: ini, until: toISODate(fim) };
    }
    case "custom":
      return { since: customFrom || today, until: customTo || today };
    default:
      return { since: "0000-01-01", until: "9999-12-31" };
  }
}

export function inPeriod(date: string | undefined, since: string, until: string): boolean {
  return Boolean(date) && date! >= since && date! <= until;
}
