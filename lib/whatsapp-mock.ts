import { CrmLead } from "./crm";

export interface WaMessage {
  from: "lead" | "studio";
  text: string;
  time: string;
}

// Conversa determinística a partir dos dados do lead — sem backend ainda,
// só para dar contexto real ao painel de atendimento (etapa R).
export function buildConversation(lead: CrmLead): WaMessage[] {
  const firstName = lead.name.split(" ")[0];
  const base: WaMessage[] = [
    { from: "lead", text: "Oi, tudo bem? Vi o studio no Instagram e queria saber mais.", time: "09:12" },
    {
      from: "studio",
      text: `Oi ${firstName}! Que bom receber sua mensagem 🙂 Me conta: o que te fez procurar Pilates agora?`,
      time: "09:14",
    },
  ];

  if (lead.stage === "novo") {
    return base;
  }
  if (lead.stage === "contato" || lead.stage === "qualificacao") {
    return [
      ...base,
      { from: "lead", text: lead.obs || "Estou com uma dor e quero melhorar a postura.", time: "09:20" },
      { from: "studio", text: "Entendi! A melhor forma de sentir é numa aula experimental gratuita. Prefere manhã, tarde ou noite?", time: "09:22" },
    ];
  }
  if (lead.stage === "experimental_agendada") {
    return [
      ...base,
      { from: "lead", text: "Prefiro de manhã, se possível.", time: "09:23" },
      { from: "studio", text: "Perfeito! Ficou agendado. Te mando o endereço e confirmo um dia antes 🙂", time: "09:25" },
    ];
  }
  if (lead.stage === "compareceu") {
    return [
      ...base,
      { from: "lead", text: lead.obs || "Gostei da aula! Vou pensar sobre o plano.", time: "10:40" },
      { from: "studio", text: "Fico feliz que gostou! Qualquer dúvida sobre os planos me chama, tá?", time: "10:42" },
    ];
  }
  if (lead.stage === "matricula" || lead.stage === "ativo") {
    return [
      ...base,
      { from: "lead", text: "Vamos fechar! Como faço para começar?", time: "11:05" },
      { from: "studio", text: "Show! Te mando o link de pagamento e já reservo seu horário 🎉", time: "11:07" },
    ];
  }
  return [
    ...base,
    { from: "lead", text: "Vou deixar pra pensar melhor, obrigado.", time: "14:00" },
  ];
}
