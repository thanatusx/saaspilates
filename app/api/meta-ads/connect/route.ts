import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const studioId = request.nextUrl.searchParams.get("studioId");
  if (!studioId) return NextResponse.json({ error: "studioId é obrigatório." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("meta_connections")
    .select("ad_account_id, connected_at")
    .eq("studio_id", studioId)
    .maybeSingle();

  return NextResponse.json({ connection: data ?? null });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const { studioId, adAccountId, pixelId, accessToken } = (await request.json()) as {
    studioId?: string;
    adAccountId?: string;
    pixelId?: string;
    accessToken?: string;
  };
  if (!studioId || !adAccountId || !accessToken) {
    return NextResponse.json({ error: "studioId, adAccountId e accessToken são obrigatórios." }, { status: 400 });
  }

  const normalizedAdAccountId = adAccountId.trim().startsWith("act_") ? adAccountId.trim() : `act_${adAccountId.trim()}`;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("meta_connections").upsert({
    studio_id: studioId,
    ad_account_id: normalizedAdAccountId,
    pixel_id: pixelId ?? null,
    access_token: accessToken,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
