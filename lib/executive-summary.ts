import { CentralInsight, ComputedIndicator } from "./control-engine";
import { DiagnosticFinding } from "./diagnostic-engine";
import { CONTROL_STAGE_META, ControlLetter } from "./control-method";

// ---------------------------------------------------------------------------
// 9. "Leitura executiva do mês" — resumo em linguagem simples, terminando
// com as 1-2 etapas do método a priorizar. Reaproveita o que o motor de
// diagnóstico (9.1) já apurou; não inventa números novos.
// ---------------------------------------------------------------------------
export interface ExecutiveSummary {
  text: string;
  priorityStages: { letter: ControlLetter; name: string; display: string }[];
}

export function buildExecutiveSummary(
  studioName: string,
  periodLabel: string,
  strengths: CentralInsight[],
  attentions: CentralInsight[],
  findings: DiagnosticFinding[]
): ExecutiveSummary {
  const priorityLetters: ControlLetter[] = [];
  for (const f of findings) {
    for (const letter of f.stageLetters) {
      if (!priorityLetters.includes(letter)) priorityLetters.push(letter);
    }
    if (priorityLetters.length >= 2) break;
  }
  if (priorityLetters.length === 0) {
    for (const a of attentions) {
      if (!priorityLetters.includes(a.letter)) priorityLetters.push(a.letter);
      if (priorityLetters.length >= 2) break;
    }
  }
  const priorityStages = priorityLetters
    .slice(0, 2)
    .map((letter) => ({ letter, name: CONTROL_STAGE_META[letter].name, display: CONTROL_STAGE_META[letter].display }));

  // Texto resumido — os números (pontos fortes/atenção/oportunidades) já
  // aparecem grandes e coloridos no card, e a causa completa já aparece no
  // card de diagnóstico logo abaixo. Aqui só a linha-síntese do mês.
  let text: string;
  if (attentions.length === 0) {
    text = `${studioName} fechou ${periodLabel} com o método em bom estado.`;
  } else if (findings.length > 0) {
    text = `Principal causa do mês: ${findings[0].title}.`;
  } else {
    text = `${studioName} fechou ${periodLabel} com ${attentions.length} ${attentions.length === 1 ? "ponto" : "pontos"} em atenção.`;
  }

  return { text, priorityStages };
}

// ---------------------------------------------------------------------------
// Oportunidades — indicadores "Estável": não são problema, mas têm margem
// clara para virar "Bom" com um ajuste pontual na etapa correspondente.
// ---------------------------------------------------------------------------
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  stageLetters: ControlLetter[];
  action?: string;
}

export function buildOpportunities(indicators: ComputedIndicator[]): Opportunity[] {
  return indicators
    .filter((ind) => ind.status === "estavel" && ind.base !== "informativo")
    .map((ind) => {
      const primaryStage = ind.stages[0] ? CONTROL_STAGE_META[ind.stages[0]] : undefined;
      return {
        id: ind.id,
        title: `${ind.label}: ${ind.value}`,
        description: `Está estável — não é um problema, mas tem espaço claro para virar "Bom" com um ajuste pontual.`,
        stageLetters: ind.stages,
        action: primaryStage
          ? `Trabalhar a etapa ${primaryStage.name.toUpperCase()} (${primaryStage.display}) para consolidar o ganho.`
          : undefined,
      };
    });
}
