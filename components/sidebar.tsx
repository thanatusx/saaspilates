"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PencilLine,
  ChartColumn,
  Lightbulb,
  Users,
  Target,
  Kanban,
  MessageCircle,
  Headset,
  Megaphone,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useStudio } from "@/components/studio-context";
import { useSidebar } from "@/components/sidebar-context";
import { computeCentralInsights, computeStageStatuses } from "@/lib/control-engine";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  adminOnly?: boolean;
}

const ICON_PROPS = { size: 18, strokeWidth: 1.75 };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, closeSidebar } = useSidebar();
  const { studios, selectedStudio, currentMetrics, previousMetrics, season, crmLeads, role } = useStudio();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const stages = computeStageStatuses(selectedStudio, currentMetrics, previousMetrics, season);
  const { attentions } = computeCentralInsights(stages);
  const precisamResposta = crmLeads.filter((l) => l.stage === "novo" || l.stage === "contato").length;

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: "PAINEL",
      items: [
        { href: "/", label: "Central de Performance", icon: <LayoutDashboard {...ICON_PROPS} /> },
        { href: "/insights", label: "Insights", icon: <Lightbulb {...ICON_PROPS} />, badge: attentions.length },
        { href: "/indicadores", label: "Indicadores", icon: <ChartColumn {...ICON_PROPS} /> },
        { href: "/metas", label: "Metas", icon: <Target {...ICON_PROPS} /> },
      ],
    },
    {
      label: "OPERAÇÃO",
      items: [
        { href: "/lancar-dados", label: "Lançar Dados", icon: <PencilLine {...ICON_PROPS} /> },
        { href: "/crm", label: "CRM", icon: <Kanban {...ICON_PROPS} />, badge: crmLeads.length },
        { href: "/whatsapp", label: "WhatsApp", icon: <MessageCircle {...ICON_PROPS} />, badge: precisamResposta },
        { href: "/secretaria", label: "Secretária", icon: <Headset {...ICON_PROPS} />, adminOnly: true },
        { href: "/trafego", label: "Tráfego", icon: <Megaphone {...ICON_PROPS} /> },
      ],
    },
    {
      label: "SISTEMA",
      items: [
        { href: "/clientes", label: "Gestão de Clientes", icon: <Users {...ICON_PROPS} />, badge: studios.length, adminOnly: true },
        { href: "/configuracoes", label: "Configurações", icon: <Settings {...ICON_PROPS} /> },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.adminOnly || role === "admin") }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col bg-(--rail) text-(--rail-ink) transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-(--brand)">
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="M5 15V5l9 5-9 5Z" fill="white" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold tracking-wide text-(--rail-ink-strong)">FRANKO</p>
          <p className="text-[9px] font-medium tracking-[0.16em] text-(--brand-sky)">INTELIGÊNCIA COMERCIAL</p>
        </div>
      </div>
      <p className="px-5 pb-4 text-[10px] font-bold tracking-[0.2em] text-(--rail-ink)">PILATES PRO</p>

      <nav className="flex-1 space-y-0.5 px-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 pt-3 text-[10px] font-semibold tracking-[0.14em] text-(--rail-ink)">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-(--brand) text-white"
                      : "text-(--rail-ink) hover:bg-white/5 hover:text-(--rail-ink-strong)"
                  }`}
                >
                  <span className={active ? "text-white" : "text-(--rail-ink)"}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-(--brand)/25 text-(--brand-sky)"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-(--rail-line) px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-(--rail-ink-strong)">{selectedStudio.name}</p>
            <p className="text-[11px] text-(--rail-ink)">
              {selectedStudio.plan} · {studios.length} {studios.length === 1 ? "studio" : "studios"} na conta
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sair"
            className="shrink-0 rounded-md p-1.5 text-(--rail-ink) transition-colors hover:bg-white/5 hover:text-(--rail-ink-strong)"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
