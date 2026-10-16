import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Handshake de verificação da Meta — chamado uma vez quando você configura a
// URL do webhook no painel do App (WhatsApp -> Configuration).
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
}

interface WhatsAppChangeValue {
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

interface WhatsAppWebhookPayload {
  entry?: { changes?: { value?: WhatsAppChangeValue }[] }[];
}

// Só dígitos, e compara pelos últimos 8 (ignora código de país/DDD/9º dígito
// variável) — o telefone do CRM é texto formatado livre ("(11) 91037-2053"),
// o da Meta vem em E.164 sem símbolos ("5511910372053").
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na.length < 8 || nb.length < 8) return false;
  return na.slice(-8) === nb.slice(-8);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as WhatsAppWebhookPayload;
  const admin = createAdminClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const { data: connection } = await admin
        .from("whatsapp_connections")
        .select("studio_id")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();
      if (!connection) continue; // número não conectado a nenhum studio ainda
      const studioId = connection.studio_id as string;

      for (const message of value?.messages ?? []) {
        if (message.type !== "text") continue; // v1: só texto

        let leadId: string | null = null;
        const { data: leads } = await admin.from("crm_leads").select("id, phone").eq("studio_id", studioId);
        const match = (leads ?? []).find((l) => phonesMatch(l.phone as string, message.from));
        if (match) leadId = match.id as string;

        await admin
          .from("whatsapp_messages")
          .upsert(
            {
              studio_id: studioId,
              lead_id: leadId,
              wa_message_id: message.id,
              direction: "inbound",
              from_phone: message.from,
              to_phone: value?.metadata?.display_phone_number ?? phoneNumberId,
              body: message.text?.body ?? "",
              status: "received",
              wa_timestamp: new Date(Number(message.timestamp) * 1000).toISOString(),
            },
            { onConflict: "wa_message_id", ignoreDuplicates: true }
          );
      }

      for (const status of value?.statuses ?? []) {
        await admin.from("whatsapp_messages").update({ status: status.status }).eq("wa_message_id", status.id);
      }
    }
  }

  // Sempre 200 rápido — a Meta reenvia agressivamente em caso de erro/timeout.
  return NextResponse.json({ ok: true });
}
