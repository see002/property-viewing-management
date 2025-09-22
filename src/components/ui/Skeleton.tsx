export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--neutral-100)] ${className}`} />;
}
