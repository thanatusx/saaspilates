"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold text-(--ink)">Bem-vindo de volta</h1>
      <p className="mt-1.5 text-[13px] text-(--ink-3)">Entre para acessar o painel dos seus studios.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-(--ink-2)">E-mail</span>
          <div className="relative">
            <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--ink-3)" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@studio.com"
              className="w-full rounded-lg border border-(--line-strong) bg-(--surface) py-2.5 pl-9 pr-3 text-sm text-(--ink) outline-none transition-colors placeholder:text-(--ink-3) focus:border-(--brand)"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-(--ink-2)">Senha</span>
          <div className="relative">
            <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--ink-3)" />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-(--line-strong) bg-(--surface) py-2.5 pl-9 pr-9 text-sm text-(--ink) outline-none transition-colors focus:border-(--brand)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ink-3) hover:text-(--ink-2)"
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
            </button>
          </div>
        </label>
        {error ? <p className="rounded-lg bg-(--bad-wash) px-3 py-2 text-[13px] text-(--bad)">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-(--brand) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-(--brand-deep) disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-(--ink-3)">
        Acesso apenas por convite —{" "}
        <Link href="/signup" className="font-medium text-(--brand) hover:underline">
          fale com a FRANKO
        </Link>
      </p>
    </AuthShell>
  );
}
