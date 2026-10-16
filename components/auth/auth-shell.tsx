import { CONTROL_LETTER_ORDER, CONTROL_STAGE_META } from "@/lib/control-method";

// Layout compartilhado das telas de login/cadastro — painel de marca à
// esquerda (oculto no mobile) + o formulário centralizado à direita. Existe
// só pra não duplicar essa moldura entre /login e /signup.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] max-w-md flex-col justify-between overflow-hidden bg-(--rail) px-10 py-12 lg:flex">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-(--brand-sky)/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-(--brand)/25 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--brand-sky)/15 text-[13px] font-bold text-(--brand-sky)">
            FK
          </div>
          <span className="text-sm font-semibold tracking-wide text-(--rail-ink-strong)">FRANKO Pilates Pro</span>
        </div>

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-(--brand-sky)">Método C.O.N.T.R.O.L</p>
          <h2 className="mt-3 max-w-sm font-display text-[28px] font-semibold leading-tight text-white">
            O painel de inteligência comercial para studios de Pilates.
          </h2>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-(--rail-ink)">
            Contexto, Oferta, Números, Tráfego, Resposta, Operação e Longevidade — tudo num só lugar, atualizado
            semana a semana.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CONTROL_LETTER_ORDER.map((letter) => (
              <span
                key={letter}
                title={CONTROL_STAGE_META[letter].name}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--rail-line) bg-white/5 text-xs font-bold text-(--brand-sky)"
              >
                {CONTROL_STAGE_META[letter].display}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-(--rail-ink)">© {new Date().getFullYear()} FRANKO Inteligência Comercial</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-(--ground) px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--brand-wash) text-[13px] font-bold text-(--brand)">
              FK
            </div>
            <span className="text-sm font-semibold tracking-wide text-(--ink)">FRANKO Pilates Pro</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
