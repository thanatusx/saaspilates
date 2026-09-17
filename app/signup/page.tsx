"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ground) px-4">
        <div className="w-full max-w-sm rounded-xl border border-(--line) bg-(--surface) p-6 text-center shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-(--brand)">FRANKO PILATES PRO</p>
          <h1 className="mt-1 text-lg font-semibold text-(--ink)">Confirme seu e-mail</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-(--ink-2)">
            Enviamos um link de confirmação para <span className="font-medium text-(--ink)">{email}</span>. Depois de
            confirmar, você já pode entrar normalmente.
          </p>
          <Link href="/login" className="mt-5 inline-block text-[13px] font-medium text-(--brand) hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ground) px-4">
      <div className="w-full max-w-sm rounded-xl border border-(--line) bg-(--surface) p-6 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest text-(--brand)">FRANKO PILATES PRO</p>
        <h1 className="mt-1 text-lg font-semibold text-(--ink)">Criar conta</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-(--ink-2)">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-(--line-strong) bg-(--surface) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--brand)"
            />
            <span className="text-[11px] text-(--ink-3)">Mínimo de 6 caracteres.</span>
          </label>
          {error ? <p className="text-[13px] text-(--bad)">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-(--brand) px-4 py-2 text-sm font-semibold text-white transition-[opacity,background-color] duration-150 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-[13px] text-(--ink-3)">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-(--brand) hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
