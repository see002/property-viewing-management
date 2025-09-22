/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Calendar, Clock } from "lucide-react";

type BaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const DateInput = React.forwardRef<HTMLInputElement, BaseProps>(function DateInput(
  { className, ...props },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
  const openPicker = () => {
    const el = innerRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") {
      try {
        (el as any).showPicker();
      } catch {}
    }
    el.focus();
  };
  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        ref={innerRef}
        type="date"
        className="border-token w-full cursor-pointer appearance-none rounded-md border bg-white px-3 py-2 pr-10 text-sm accent-[var(--primary-500)] outline-none placeholder:text-neutral-400 focus-visible:border-[var(--primary-400)] focus-visible:ring-2 focus-visible:ring-[var(--primary-200)]"
        {...props}
      />
      <button
        type="button"
        onClick={openPicker}
        className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-neutral-500 hover:bg-[var(--neutral-100)]"
        aria-label="Open date picker"
        tabIndex={-1}
      >
        <Calendar className="h-4 w-4" />
      </button>
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
        }
      `}</style>
    </div>
  );
});

export const TimeInput = React.forwardRef<HTMLInputElement, BaseProps>(function TimeInput(
  { className, ...props },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
  const openPicker = () => {
    const el = innerRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") {
      try {
        (el as any).showPicker();
      } catch {}
    }
    el.focus();
  };
  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        ref={innerRef}
        type="time"
        className="border-token w-full cursor-pointer appearance-none rounded-md border bg-white px-3 py-2 pr-10 text-sm accent-[var(--primary-500)] outline-none placeholder:text-neutral-400 focus-visible:border-[var(--primary-400)] focus-visible:ring-2 focus-visible:ring-[var(--primary-200)]"
        {...props}
      />
      <button
        type="button"
        onClick={openPicker}
        className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-neutral-500 hover:bg-[var(--neutral-100)]"
        aria-label="Open time picker"
        tabIndex={-1}
      >
        <Clock className="h-4 w-4" />
      </button>
      <style jsx>{`
        input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0;
        }
      `}</style>
    </div>
  );
});
