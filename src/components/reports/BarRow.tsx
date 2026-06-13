export function BarRow({
  label,
  count,
  pct,
}: {
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-ink">{label}</span>
        <span className="rb-numerals text-ink-3">
          {count}
          <span className="ml-1 text-ink-4">· {pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-blue"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
