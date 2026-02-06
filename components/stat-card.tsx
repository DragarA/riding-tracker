export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stable-card p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-stable-saddle">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stable-ink">{value}</p>
      {note ? <p className="mt-2 text-xs text-stable-ink/60">{note}</p> : null}
    </div>
  );
}
