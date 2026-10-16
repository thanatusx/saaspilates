// CRM — funil de leads por studio. Complementa os números agregados do
// lançamento semanal com uma visão operacional, lead a lead. Mock local por
// enquanto (sem backend); a forma dos dados já é multi-studio.

export type CrmStage =
  | "novo"
  | "contato"
  | "qualificacao"
  | "experimental_agendada"
  | "compareceu"
  | "matricula"
  | "ativo"
  | "perdido";

export const CRM_STAGES: { key: CrmStage; label: string }[] = [
  { key: "novo", label: "Novo contato" },
  { key: "contato", label: "Em contato" },
  { key: "qualificacao", label: "Qualificação" },
  { key: "experimental_agendada", label: "Aula agendada" },
  { key: "compareceu", label: "Compareceu" },
  { key: "matricula", label: "Matrícula" },
  { key: "ativo", label: "Aluno ativo" },
  { key: "perdido", label: "Perdido" },
];

export type CrmOrigin =
  | "instagram"
  | "googleAds"
  | "google"
  | "referral"
  | "medical"
  | "aggregators"
  | "direct"
  | "other";

export const CRM_ORIGIN_LABEL: Record<CrmOrigin, string> = {
  instagram: "Instagram",
  googleAds: "Google Ads",
  google: "Google orgânico",
  referral: "Indicação",
  medical: "Encaminhamento médico",
  aggregators: "Agregadores",
  direct: "Direto / passante",
  other: "Outros",
};

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  origin: CrmOrigin;
  stage: CrmStage;
  responsible: string;
  leadScore: number; // 0-100
  lastActivity: string; // "dd/mm hh:mm"
  obs: string;
  /** Data (YYYY-MM-DD) em que o lead entrou em cada etapa pela primeira vez — alimenta o funil por período. */
  journey: Partial<Record<CrmStage, string>>;
}

function makeLeads(studioId: string, names: [string, CrmStage, CrmOrigin, number, string][]): CrmLead[] {
  return names.map(([name, stage, origin, score, obs], i) => ({
    id: `${studioId}-lead-${i + 1}`,
    name,
    phone: `(11) 9${(1000 + i * 37) % 9000 + 1000}-${(2000 + i * 53) % 9000 + 1000}`,
    origin,
    stage,
    responsible: i % 2 === 0 ? "Marina" : "Jonas",
    leadScore: score,
    lastActivity: `${(26 - (i % 20)).toString().padStart(2, "0")}/08 ${(8 + (i % 10)).toString().padStart(2, "0")}:${(i * 7) % 60}`.replace(/:(\d)$/, ":0$1"),
    obs,
    journey: {},
  }));
}

export const CRM_LEADS: Record<string, CrmLead[]> = {
  "movimento-pilates": makeLeads("movimento-pilates", [
    ["Ana Beatriz Souza", "ativo", "instagram", 92, "Fechou plano Mensal Plus"],
    ["Carlos Eduardo Lima", "compareceu", "referral", 68, "Gostou, vai decidir com a esposa"],
    ["Fernanda Torres", "novo", "googleAds", 34, "Pediu tabela de planos"],
    ["Rafael Menezes", "ativo", "direct", 88, "Fechou trimestral"],
    ["Juliana Prado", "perdido", "instagram", 15, "Sumiu após 3 tentativas"],
    ["Marcos Vinícius", "contato", "instagram", 45, "Perguntou horário de manhã"],
    ["Bianca Ferreira", "experimental_agendada", "referral", 61, "Agendada para quinta 9h"],
    ["Diego Almeida", "ativo", "googleAds", 90, "Fechou mensal"],
    ["Patrícia Nunes", "qualificacao", "instagram", 52, "Dor lombar, indicação médica"],
    ["Eduardo Castro", "novo", "aggregators", 28, "Só pediu preço"],
    ["Larissa Gomes", "compareceu", "instagram", 71, "Achou o valor alto"],
    ["Thiago Rocha", "experimental_agendada", "direct", 58, "Confirmar presença amanhã"],
  ]),
  "corpo-consciente": makeLeads("corpo-consciente", [
    ["Camila Duarte", "novo", "referral", 30, "Indicação de aluna atual"],
    ["Marcelo Souza", "contato", "instagram", 22, "Lead frio, sem resposta há 2 dias"],
    ["Vanessa Ramos", "perdido", "instagram", 12, "Achou caro comparado à academia"],
    ["Roberto Alves", "qualificacao", "direct", 40, "Passou na porta, quer saber de plano"],
    ["Simone Cardoso", "experimental_agendada", "referral", 55, "Agendada sexta 18h"],
    ["André Teixeira", "novo", "other", 18, "Preencheu formulário do site"],
    ["Tatiane Pinto", "ativo", "referral", 80, "Fechou 2x/semana"],
  ]),
  "elevare-clinica": makeLeads("elevare-clinica", [
    ["Renata Azevedo", "ativo", "medical", 95, "Encaminhada por ortopedista"],
    ["Felipe Barbosa", "compareceu", "google", 74, "Avaliação postural feita, decidindo"],
    ["Aline Freitas", "experimental_agendada", "medical", 66, "Encaminhamento pós-cirúrgico"],
    ["Gustavo Mendes", "ativo", "googleAds", 89, "Fechou semestral"],
    ["Débora Lima", "novo", "aggregators", 25, "Achou no Doctoralia"],
    ["Márcio Nunes", "qualificacao", "medical", 48, "Aguardando liberação médica"],
    ["Priscila Costa", "ativo", "google", 91, "Fechou mensal"],
    ["Vinícius Rocha", "contato", "instagram", 33, "Perguntou sobre hérnia de disco"],
  ]),
};

export function getCrmLeads(studioId: string): CrmLead[] {
  return CRM_LEADS[studioId] ?? [];
}
