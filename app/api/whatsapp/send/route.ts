import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH_API_VERSION = "v21.0";

export async function POST(request: NextRequest) {
  const { studioId, leadId, to, body } = (await request.json()) as {
    studioId?: string;
    leadId?: string;
    to?: string;
    body?: string;
  };
  if (!studioId || !to || !body?.trim()) {
    return NextResponse.json({ error: "studioId, to e body são obrigatórios." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, studio_id").eq("id", user.id).maybeSingle();
  const canAccess = profile?.role === "admin" || (profile?.role === "owner" && profile.studio_id === studioId);
  if (!canAccess) return NextResponse.json({ error: "Sem permissão para este studio." }, { status: 403 });

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("whatsapp_connections")
    .select("phone_number_id, access_token")
    .eq("studio_id", studioId)
    .maybeSingle();
  if (!connection) {
    return NextResponse.json({ error: "Este studio ainda não tem um número de WhatsApp conectado." }, { status: 409 });
  }

  const graphRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${connection.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
  const graphJson = await graphRes.json();

  if (!graphRes.ok) {
    const errorCode = graphJson?.error?.code;
    // 131047 = mensagem fora da janela de 24h — só templates aprovados servem
    // aqui (fora de escopo nesta leva).
    if (errorCode === 131047) {
      return NextResponse.json(
        { error: "Fora da janela de 24h — só é possível responder com um template aprovado pela Meta." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: graphJson?.error?.message ?? "Falha ao enviar via WhatsApp." }, { status: 502 });
  }

  const waMessageId = graphJson?.messages?.[0]?.id as string | undefined;
  await admin.from("whatsapp_messages").insert({
    studio_id: studioId,
    lead_id: leadId ?? null,
    wa_message_id: waMessageId,
    direction: "outbound",
    from_phone: connection.phone_number_id,
    to_phone: to,
    body,
    status: "sent",
    wa_timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
