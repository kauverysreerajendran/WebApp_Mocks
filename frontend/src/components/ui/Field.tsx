"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

export const controlClasses =
  "block w-full rounded-control border bg-surface px-3 text-sm text-text placeholder:text-muted " +
  "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted";

export const controlState = (invalid: boolean) =>
  invalid ? "border-error focus:border-error" : "border-border hover:border-border-strong";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Label + control + hint/error wiring. Every input goes through this so labels are never missing. */
export function Field({ label, hint, error, optional, hideLabel, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-sm font-medium text-text", hideLabel && "sr-only")}>
        {label}
        {optional && <span className="font-normal text-muted"> ({strings.common.optional})</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type BaseFieldProps = Pick<FieldProps, "label" | "hint" | "error" | "optional" | "hideLabel"> & {
  containerClassName?: string;
  /** Small leading icon drawn inside the control. */
  icon?: ReactNode;
};

/** Positions a leading icon over the control; renders the control alone when there is none. */
function WithIcon({ icon, top, children }: { icon?: ReactNode; top?: boolean; children: ReactNode }) {
  if (!icon) return children;
  return (
    <div className="relative">
      <span aria-hidden className={cn("pointer-events-none absolute left-3 text-accent/80", top ? "top-2.5" : "top-1/2 -translate-y-1/2")}>
        {icon}
      </span>
      {children}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  optional,
  hideLabel,
  containerClassName,
  className,
  icon,
  ...rest
}: BaseFieldProps & ComponentProps<"input">) {
  return (
    <Field {...{ label, hint, error, optional, hideLabel }} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <WithIcon icon={icon}>
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClasses, controlState(invalid), "h-10", icon ? "pl-10" : undefined, className)}
            {...rest}
          />
        </WithIcon>
      )}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  hideLabel,
  containerClassName,
  className,
  rows = 4,
  icon,
  ...rest
}: BaseFieldProps & ComponentProps<"textarea">) {
  return (
    <Field {...{ label, hint, error, optional, hideLabel }} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <WithIcon icon={icon} top>
          <textarea
            id={id}
            rows={rows}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClasses, controlState(invalid), "py-2", icon ? "pl-10" : undefined, className)}
            {...rest}
          />
        </WithIcon>
      )}
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  label,
  hint,
  error,
  optional,
  hideLabel,
  containerClassName,
  className,
  options,
  placeholder,
  ...rest
}: BaseFieldProps & ComponentProps<"select"> & { options: SelectOption[]; placeholder?: string }) {
  return (
    <Field {...{ label, hint, error, optional, hideLabel }} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClasses, controlState(invalid), "h-10 appearance-none pr-9", className)}
            {...rest}
          >
            {placeholder !== undefined && (
              <option value="" disabled={rest.required}>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Field>
  );
}
