import type { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`shadow-token-sm flex h-full flex-col rounded-lg bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`mb-3 flex items-start justify-between gap-3 ${className}`}>{children}</div>
  );
}

export function CardTitle({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={`text-base font-semibold text-[var(--foreground)] ${className}`}>{children}</h3>
  );
}

export function CardContent({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>;
}
