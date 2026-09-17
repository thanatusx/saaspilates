import { STATUS_COLOR, STATUS_LABEL, STATUS_LEVEL, StatusKey } from "@/lib/control-method";

// Medidor de 5 blocos usado em todo o painel para representar a saúde de um indicador.
export function StatusMeter({ status }: { status: StatusKey }) {
  const level = STATUS_LEVEL[status];
  const color = STATUS_COLOR[status];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-[3px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-1.5 rounded-[1px] ${i < level ? color.dot : "bg-(--line-strong)"}`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${color.text}`}>{STATUS_LABEL[status]}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: StatusKey }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${color.bg} ${color.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusColorDot({ status }: { status: StatusKey }) {
  const color = STATUS_COLOR[status];
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color.dot}`} />;
}

export function StageTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-(--line) bg-(--surface-2) px-2 py-1 text-[10px] font-bold tracking-wide text-(--ink-3)">
      {children}
    </span>
  );
}
