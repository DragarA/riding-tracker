export function StatCard({
  label,
  value,
  note,
  details,
  detailsInline = false,
  detailsClassName
}: {
  label: string;
  value: string;
  note?: string;
  details?: string[];
  detailsInline?: boolean;
  detailsClassName?: string;
}) {
  return (
    <div className="stable-card p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-stable-saddle">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stable-ink">{value}</p>
      {note ? <p className="mt-2 text-xs text-stable-ink/60">{note}</p> : null}
      {details && details.length > 0 ? (
        <div
          className={
            detailsInline
              ? `mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stable-ink/70 ${detailsClassName ?? ""}`
              : `mt-2 space-y-1 text-xs text-stable-ink/70 ${detailsClassName ?? ""}`
          }
        >
          {details.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
