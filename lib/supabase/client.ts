import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em componentes "use client" (o StudioProvider,
// as páginas de login/signup). Uma instância nova por chamada é o padrão
// recomendado pelo @supabase/ssr — internamente é leve.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
