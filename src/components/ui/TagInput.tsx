"use client";

import * as React from "react";
import { X } from "lucide-react";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string; // wrapper
  inputClassName?: string;
  validate?: (value: string) => boolean; // custom validator; default: email
};

const defaultEmailValidator = (v: string) => {
  const re = /^(?:[a-zA-Z0-9_.'%+-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
  return re.test(v);
};

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  validate,
}: TagInputProps) {
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const validator = validate ?? defaultEmailValidator;

  const tryAdd = (raw: string) => {
    const token = raw.trim();
    if (!token) return;
    if (!validator(token)) {
      setError("Invalid email");
      return;
    }
    if (value.includes(token)) {
      setError("Already added");
      return;
    }
    onChange([...value, token]);
    setInput("");
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tryAdd(input);
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      // remove last tag when empty
      onChange(value.slice(0, -1));
    }
  };

  const onBlur = () => {
    if (input.trim() !== "") tryAdd(input);
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className={`border-token rounded-md border bg-white px-2 py-1 ${className ?? ""}`}>
      <div className="flex flex-wrap gap-2">
        {value.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary-50)] px-2 py-1 text-xs text-[var(--primary-700)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="rounded p-0.5 text-[var(--primary-700)] hover:bg-[var(--primary-100)] focus-visible:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className={`min-w-[10rem] flex-1 bg-transparent px-2 py-1 text-sm outline-none ${inputClassName ?? ""}`}
          placeholder={placeholder ?? "Type email and press Enter or ,"}
        />
      </div>
      {error && <p className="mt-1 px-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
