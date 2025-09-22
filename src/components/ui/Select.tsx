"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type LabeledSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  name?: string;
  className?: string; // wrapper
  selectClassName?: string; // select element
  stacked?: boolean; // label on top
  labelIcon?: React.ReactNode;
  selectRef?: React.Ref<HTMLSelectElement>;
};

export function LabeledSelect({
  label,
  value,
  onChange,
  options,
  id,
  name,
  className,
  selectClassName,
  stacked,
  labelIcon,
  selectRef,
}: LabeledSelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const wrapperClass = stacked ? "flex flex-col gap-1" : "flex items-center gap-4";
  const labelClass = stacked
    ? "mb-1 block text-sm font-medium text-neutral-700 inline-flex items-center gap-2"
    : "text-sm text-neutral-600 inline-flex items-center gap-2";
  const isPlaceholder = value === "";
  return (
    <div className={`${wrapperClass} ${className ?? ""}`}>
      <label htmlFor={selectId} className={labelClass}>
        {labelIcon}
        {label}
      </label>
      <div className="relative w-full">
        <select
          id={selectId}
          name={name}
          ref={selectRef}
          className={`border-token w-full cursor-pointer appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-sm ${isPlaceholder ? "text-neutral-400" : "text-neutral-900"} ${selectClassName ?? ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </div>
  );
}
