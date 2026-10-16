import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

// Sem auto-cadastro: contas são criadas pelo administrador (Supabase +
// vínculo manual a um studio via profiles), não por um formulário público.
export default function SignupPage() {
  return (
    <AuthShell>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-(--brand-wash) text-(--brand)">
        <UserRoundPlus size={22} strokeWidth={1.75} />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-(--ink)">Acesso por convite</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-(--ink-3)">
        As contas do Pilates Pro são criadas pelo administrador e vinculadas ao studio de cada cliente. Fale com a
        FRANKO para receber seu acesso.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded-lg bg-(--brand) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep)"
      >
        Ir para o login
      </Link>
    </AuthShell>
  );
}
