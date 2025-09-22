"use client";

import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`border-token w-full rounded-md border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus-visible:border-[var(--primary-400)] focus-visible:ring-2 focus-visible:ring-[var(--primary-200)] ${className ?? ""}`}
      {...props}
    />
  );
});
