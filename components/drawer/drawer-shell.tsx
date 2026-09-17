"use client";

import { X } from "lucide-react";
import { useDrawer } from "./drawer-context";

export function DrawerHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { closeDrawer } = useDrawer();
  return (
    <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
      <div className="flex-1">
        <p className="text-[10px] font-bold tracking-widest text-[var(--ink-3)]">{eyebrow}</p>
        <h2 className="mt-1 text-[19px] font-semibold text-[var(--ink)]">{title}</h2>
        {children}
      </div>
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Fechar"
        className="rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function DrawerBody({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 px-5 py-5">{children}</div>;
}
