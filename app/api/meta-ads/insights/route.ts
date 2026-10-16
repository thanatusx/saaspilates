import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH_API_VERSION = "v21.0";

// action_type conhecidos que representam um lead — a Meta não tem um único
// nome fixo, depende de como o evento foi configurado no pixel/formulário.
const LEAD_ACTION_TYPES = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];

interface InsightAction {
  action_type: string;
  value: string;
}
interface InsightRow {
  campaign_name?: string;
  spend?: string;
  actions?: InsightAction[];
}

function leadsFromActions(actions: InsightAction[] | undefined): number {
  if (!actions) return 0;
  return actions.filter((a) => LEAD_ACTION_TYPES.includes(a.action_type)).reduce((sum, a) => sum + Number(a.value || 0), 0);
}

export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId");
  const since = request.nextUrl.searchParams.get("since");
  const until = request.nextUrl.searchParams.get("until");
  if (!studioId || !since || !until) {
    return NextResponse.json({ error: "studioId, since e until são obrigatórios." }, { status: 400 });
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
    .from("meta_connections")
    .select("ad_account_id, access_token")
    .eq("studio_id", studioId)
    .maybeSingle();
  if (!connection) {
    return NextResponse.json({ error: "Este studio ainda não tem uma conta de anúncios conectada." }, { status: 409 });
  }

  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${connection.ad_account_id}/insights?level=campaign&fields=campaign_name,spend,actions&time_range=${timeRange}&limit=100&access_token=${connection.access_token}`;

  const graphRes = await fetch(url);
  const graphJson = await graphRes.json();

  if (!graphRes.ok) {
    return NextResponse.json(
      { error: graphJson?.error?.message ?? "Falha ao buscar dados da Meta. Confira o token e o Ad Account ID." },
      { status: 502 }
    );
  }

  const rows = (graphJson?.data ?? []) as InsightRow[];
  const campaigns = rows.map((row) => ({
    name: row.campaign_name ?? "—",
    spend: Number(row.spend || 0),
    leads: leadsFromActions(row.actions),
  }));
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);

  return NextResponse.json({ campaigns, totalSpend, totalLeads });
}
