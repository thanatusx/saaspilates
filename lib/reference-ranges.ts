import { OperationModel } from "./types";

// Réguas por modelo de operação — "ticket, ocupação e capacidade têm réguas
// diferentes por modelo". Os valores abaixo são um ponto de partida razoável;
// ainda não vieram da calibração formal da FK (equivalente aos indicadores
// marcados [CALIBRAR] na seção 3.2), então mantenha-os isolados aqui para
// serem ajustados sem tocar no motor de cálculo (lib/control-engine.ts).
export interface ReferenceRange {
  ticketMedio: { min: number; max: number };
  ocupacaoIdeal: { min: number; max: number };
  cpl: { min: number; max: number };
  cac: { min: number; max: number };
  margemSaudavel: { min: number; max: number };
  capacidadeDescricao: string;
}

export const REFERENCE_RANGES: Record<OperationModel, ReferenceRange> = {
  boutique: {
    ticketMedio: { min: 420, max: 650 },
    ocupacaoIdeal: { min: 70, max: 90 },
    cpl: { min: 70, max: 110 },
    cac: { min: 350, max: 550 },
    margemSaudavel: { min: 28, max: 38 },
    capacidadeDescricao: "1 a 3 alunos por horário",
  },
  grupo: {
    ticketMedio: { min: 260, max: 380 },
    ocupacaoIdeal: { min: 75, max: 90 },
    cpl: { min: 60, max: 80 },
    cac: { min: 250, max: 350 },
    margemSaudavel: { min: 25, max: 30 },
    capacidadeDescricao: "10 a 15 alunos por turma",
  },
  clinica: {
    ticketMedio: { min: 380, max: 600 },
    ocupacaoIdeal: { min: 65, max: 85 },
    cpl: { min: 80, max: 130 },
    cac: { min: 400, max: 600 },
    margemSaudavel: { min: 22, max: 32 },
    capacidadeDescricao: "variável — depende da agenda clínica",
  },
  franquia: {
    ticketMedio: { min: 300, max: 450 },
    ocupacaoIdeal: { min: 75, max: 92 },
    cpl: { min: 55, max: 85 },
    cac: { min: 280, max: 400 },
    margemSaudavel: { min: 20, max: 28 },
    capacidadeDescricao: "conforme padrão da rede",
  },
};
