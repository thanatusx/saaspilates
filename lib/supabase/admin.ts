import { createClient } from "@supabase/supabase-js";

// Cliente com a service role key — ignora RLS. Só pode ser usado dentro de
// rotas de servidor (app/api/**/route.ts), nunca importado por um Client
// Component nem por um módulo que rode no browser. É a única forma de ler
// whatsapp_connections.access_token e de escrever em whatsapp_messages.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
