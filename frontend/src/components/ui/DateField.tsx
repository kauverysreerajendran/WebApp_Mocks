"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { Field, controlClasses, controlState } from "./Field";

interface DateFieldProps {
  label?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: Matcher | Matcher[];
  /** Block dates before today. Evaluated lazily so prerendering never reads the clock. */
  disablePast?: boolean;
  /** Block dates more than N days ahead. */
  maxDays?: number;
  error?: string;
  hint?: string;
  /** Render the calendar inline instead of in a popover. */
  inline?: boolean;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DateField({
  label = strings.fields.date,
  value,
  onChange,
  disabled,
  disablePast = false,
  maxDays,
  error,
  hint,
  inline = false,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const groupId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const matchers: Matcher[] = [
    ...(disablePast ? [(day: Date) => day < startOfToday()] : []),
    ...(maxDays !== undefined
      ? [
          (day: Date) => {
            const limit = startOfToday();
            limit.setDate(limit.getDate() + maxDays);
            return day > limit;
          },
        ]
      : []),
    ...(disabled ? [disabled].flat() : []),
  ];

  const calendar = (
    <DayPicker
      mode="single"
      selected={value}
      onSelect={(d) => {
        onChange(d);
        setOpen(false);
      }}
      disabled={matchers}
      defaultMonth={value}
      autoFocus={!inline}
    />
  );

  if (inline) {
    return (
      <div role="group" aria-labelledby={groupId} className="flex flex-col gap-1.5">
        <span id={groupId} className="text-sm font-medium text-text">
          {label}
        </span>
        <div
          className={cn(
            "w-fit max-w-full overflow-x-auto rounded-card border bg-surface p-1.5",
            error ? "border-error" : "border-border",
          )}
        >
          {calendar}
        </div>
        {value && (
          <p className="text-xs font-medium text-accent">
            {formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div ref={rootRef} className="relative">
          <button
            id={id}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={describedBy}
            onClick={() => setOpen((o) => !o)}
            className={cn(controlClasses, controlState(invalid), "flex h-10 items-center justify-between text-left")}
          >
            <span className={value ? "text-text" : "text-muted"}>
              {value
                ? formatDate(value, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                : strings.datePicker.placeholder}
            </span>
            <CalendarDays size={16} aria-hidden className="text-muted" />
          </button>
          {open && (
            <div
              role="dialog"
              aria-label={label}
              className="absolute top-full left-0 z-30 mt-2 rounded-card border border-border bg-surface p-2 shadow-modal"
            >
              {calendar}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
