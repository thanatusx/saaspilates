import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase para Server Components / route handlers — lê/escreve a
// sessão via cookies do request. O middleware já garante que a sessão está
// sempre atualizada antes de qualquer Server Component rodar.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrever
            // cookies — inofensivo, o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}
