"use client";

import { Check } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group inline-flex min-h-10 cursor-pointer items-start gap-2.5 py-1.5 has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <span className="relative mt-px inline-flex size-[18px] shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer size-[18px] cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors hover:border-accent checked:border-accent checked:bg-accent focus-ring disabled:cursor-not-allowed"
          {...rest}
        />
        <Check
          size={12}
          strokeWidth={3}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto text-on-accent opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-text">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
