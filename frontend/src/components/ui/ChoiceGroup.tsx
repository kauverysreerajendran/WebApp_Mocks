"use client";

import { Check, ChevronRight } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Choice<V extends string> {
  value: V;
  label: string;
  description?: string;
  /** Extra content, e.g. price or image. */
  meta?: ReactNode;
  media?: ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<V extends string> {
  legend: string;
  hideLegend?: boolean;
  name?: string;
  value: V | null;
  onChange: (value: V) => void;
  choices: Choice<V>[];
  /** "card" = full-width radio cards, "tile" = image grid boxes */
  variant?: "card" | "tile";
  columns?: string;
  error?: string;
  className?: string;
}

/** Small filled check shown in the corner of the selected option. */
function SelectedBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full bg-accent text-on-accent shadow-card",
        className,
      )}
    >
      <Check size={12} strokeWidth={3} />
    </span>
  );
}

/**
 * Single-select group built on native radios, so arrow-key navigation and
 * screen-reader semantics come for free. Used for services, packages and design options.
 */
export function ChoiceGroup<V extends string>({
  legend,
  hideLegend,
  name,
  value,
  onChange,
  choices,
  variant = "card",
  columns,
  error,
  className,
}: ChoiceGroupProps<V>) {
  const autoName = useId();
  const groupName = name ?? autoName;
  const errorId = `${groupName}-error`;

  return (
    <fieldset className={className} aria-describedby={error ? errorId : undefined}>
      <legend className={cn("mb-2.5 text-sm font-semibold text-primary", hideLegend && "sr-only")}>{legend}</legend>
      <div
        className={cn(
          "grid gap-3",
          columns ?? (variant === "tile" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1"),
        )}
      >
        {choices.map((choice) => {
          const checked = value === choice.value;
          return (
            <label
              key={choice.value}
              className={cn(
                "group relative flex cursor-pointer rounded-card border bg-surface transition-[border-color,box-shadow,background-color] duration-200 ease-out-soft",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                "has-disabled:cursor-not-allowed has-disabled:opacity-50",
                checked
                  ? "border-accent bg-accent-soft ring-1 ring-accent"
                  : "border-border shadow-card hover:border-border-strong hover:shadow-lift",
                variant === "card" ? "items-center gap-3 p-3 md:p-4" : "flex-col p-1.5",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={choice.value}
                checked={checked}
                disabled={choice.disabled}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />
              {checked && variant === "tile" && <SelectedBadge className="absolute -top-2 -right-2 z-10 size-6" />}
              {variant === "card" ? (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      checked ? "border-accent" : "border-border-strong group-hover:border-accent/60",
                    )}
                  >
                    {checked && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  {choice.media}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-primary">{choice.label}</span>
                    {choice.description && <span className="text-xs text-muted">{choice.description}</span>}
                  </span>
                  {choice.meta && <span className="shrink-0 self-center">{choice.meta}</span>}
                </>
              ) : (
                <>
                  {choice.media && <span className="block overflow-hidden rounded-[7px]">{choice.media}</span>}
                  <span className="flex flex-1 flex-col gap-0.5 px-1 pt-2 pb-1">
                    <span className="flex items-center justify-between gap-1.5">
                      <span
                        className={cn(
                          "text-xs leading-snug font-medium md:text-sm",
                          checked ? "text-accent-strong" : "text-primary",
                        )}
                      >
                        {choice.label}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          checked
                            ? "invisible"
                            : "border-border bg-surface-muted text-muted group-hover:border-accent/30 group-hover:text-accent",
                        )}
                      >
                        <ChevronRight size={12} />
                      </span>
                    </span>
                    {choice.description && <span className="text-xs text-muted">{choice.description}</span>}
                    {choice.meta && <span className="mt-1">{choice.meta}</span>}
                  </span>
                </>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
