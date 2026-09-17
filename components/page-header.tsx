"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "./sidebar-context";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  below?: React.ReactNode;
}

function MenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir menu"
      className="-ml-1.5 rounded-lg p-2 text-(--ink-2) transition-colors hover:bg-(--surface-2) lg:hidden"
    >
      <Menu size={20} strokeWidth={1.75} />
    </button>
  );
}

export function PageHeader({ title, subtitle, actions, below }: PageHeaderProps) {
  return (
    <header className="border-b border-(--line) bg-(--surface) px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <MenuButton />
          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-semibold tracking-tight text-(--ink) sm:text-[22px]">{title}</h1>
            <p className="truncate text-[13px] text-(--ink-3) sm:text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
      {below ? <div className="mt-4">{below}</div> : null}
    </header>
  );
}

export function HeaderButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-(--line-strong) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--ink-2) shadow-sm transition-all duration-150 hover:bg-(--surface-2) hover:shadow active:scale-95"
    >
      {children}
    </button>
  );
}

export function ReadyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--line-strong) bg-(--surface-2) px-3 py-1.5 text-xs font-medium text-(--ink-2)">
      <span className="h-1.5 w-1.5 rounded-full bg-(--ok)" />
      Pronto
    </span>
  );
}
