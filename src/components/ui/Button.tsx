"use client";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, className = "", variant = "primary", size = "md", ...props }, ref) => {
    const Comp = asChild ? Slot : ("button" as const);
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none";
    const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
    const variants =
      variant === "primary"
        ? "bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]"
        : variant === "outline"
          ? "border border-[var(--neutral-300)] bg-white text-[var(--foreground)] hover:bg-[var(--neutral-50)]"
          : "text-[var(--foreground)] hover:bg-[var(--neutral-100)]";

    if (Comp === "button") {
      return (
        <button ref={ref} className={`${base} ${sizes} ${variants} ${className}`} {...props} />
      );
    }
    // Slot forwards to child, ref on Slot is not typed as HTMLButtonElement; omit ref
    return <Comp className={`${base} ${sizes} ${variants} ${className}`} {...props} />;
  },
);
Button.displayName = "Button";
