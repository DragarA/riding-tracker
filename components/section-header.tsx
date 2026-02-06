import type { ReactNode } from "react";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-stable-saddle">Stable Manager</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-stable-ink/70">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
