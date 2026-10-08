"use client";

import { useId } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Show the current Yes/No value next to the switch. */
  showValue?: boolean;
  className?: string;
}

export function Switch({ label, checked, onChange, disabled, showValue = true, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("flex min-h-10 items-center justify-between gap-4", className)}>
      <label htmlFor={id} className="text-sm text-text">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {showValue && (
          <span aria-hidden className="w-7 text-xs text-muted">
            {checked ? strings.common.yes : strings.common.no}
          </span>
        )}
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "border-accent bg-accent" : "border-border-strong bg-surface-muted",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block size-4 rounded-full bg-surface shadow-card transition-transform",
              checked ? "translate-x-5" : "translate-x-1",
            )}
          />
        </button>
      </div>
    </div>
  );
}
