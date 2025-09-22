export function Progress({
  value,
  className = "",
  barClassName = "",
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 w-full rounded-full bg-[var(--neutral-100)] ${className}`}>
      <div
        className={`h-2 rounded-full transition-[width] ${barClassName}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
