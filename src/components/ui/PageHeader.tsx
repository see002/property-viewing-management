import type { PropsWithChildren, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
  className = "",
}: PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        <h1 className="text-2xl leading-tight font-semibold text-[var(--foreground)]">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-neutral-600">{description}</p> : null}
      </div>
      {action ? <div className="mt-2 sm:mt-0">{action}</div> : null}
    </div>
  );
}
