"use client";

import { Info } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Checkbox, Select } from "@/components/ui";
import { strings } from "@/i18n";
import type { Availability, Weekday } from "@/lib/api/types";
import { formatClock } from "@/lib/format";

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Half-hour steps from 06:00 to 22:00. */
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return { value: hhmm, label: formatClock(hhmm) };
});

interface AvailabilityFormProps {
  initial: Pick<Availability, "workingDays" | "openTime" | "closeTime"> & Partial<Pick<Availability, "breakStart" | "breakEnd">>;
  onSubmit: (value: Availability) => Promise<void> | void;
  submitLabel: string;
  /** Extra actions rendered next to the submit button (e.g. Back). */
  secondary?: ReactNode;
}

const box = "rounded-card border border-border bg-surface p-4";

/**
 * Calendar & Availability (reference screen 6): working days, working hours and an optional break.
 * Defaults follow the brief — Mon–Sat, 09:00 to 19:00. Also used during onboarding.
 */
export function AvailabilityForm({ initial, onSubmit, submitLabel, secondary }: AvailabilityFormProps) {
  const p = strings.tailorPortal;
  const [days, setDays] = useState<Set<Weekday>>(new Set(initial.workingDays));
  const [openTime, setOpenTime] = useState(initial.openTime);
  const [closeTime, setCloseTime] = useState(initial.closeTime);
  const [breakStart, setBreakStart] = useState(initial.breakStart ?? "");
  const [breakEnd, setBreakEnd] = useState(initial.breakEnd ?? "");
  const [errors, setErrors] = useState<{ days?: string; hours?: string; break?: string }>({});
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: Weekday, on: boolean) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (on) next.add(d);
      else next.delete(d);
      return next;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const hasBreak = Boolean(breakStart || breakEnd);
    const errs = {
      days: days.size === 0 ? strings.validation.days : undefined,
      hours: openTime >= closeTime ? strings.validation.hours : undefined,
      break:
        hasBreak && (!breakStart || !breakEnd || breakStart >= breakEnd || breakStart < openTime || breakEnd > closeTime)
          ? p.breakInvalid
          : undefined,
    };
    setErrors(errs);
    if (errs.days || errs.hours || errs.break) return;
    setSaving(true);
    try {
      await onSubmit({
        workingDays: WEEKDAYS.filter((d) => days.has(d)),
        openTime,
        closeTime,
        breakStart: hasBreak ? breakStart : null,
        breakEnd: hasBreak ? breakEnd : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const optional = [{ value: "", label: "—" }, ...TIME_OPTIONS];

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className={box} aria-describedby={errors.days ? "days-error" : undefined}>
          <legend className="sr-only">{p.workingDays}</legend>
          <p aria-hidden className="mb-1 text-sm font-semibold text-primary">
            {p.workingDays}
          </p>
          <div className="flex flex-col">
            {WEEKDAYS.map((d) => (
              <Checkbox
                key={d}
                label={strings.weekdaysLong[d]}
                checked={days.has(d)}
                onChange={(e) => toggleDay(d, e.target.checked)}
                className="min-h-8 py-1"
              />
            ))}
          </div>
          {errors.days && (
            <p id="days-error" role="alert" className="mt-1 text-xs text-error">
              {errors.days}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-4">
          <fieldset className={box}>
            <legend className="sr-only">{p.workingHours}</legend>
            <p aria-hidden className="mb-3 text-sm font-semibold text-primary">
              {p.workingHours}
            </p>
            <div className="flex flex-col gap-3">
              <Select label={p.startTime} value={openTime} onChange={(e) => setOpenTime(e.target.value)} options={TIME_OPTIONS} />
              <Select label={p.endTime} value={closeTime} onChange={(e) => setCloseTime(e.target.value)} options={TIME_OPTIONS} error={errors.hours} />
            </div>
          </fieldset>
          <p className="flex items-start gap-2 rounded-card border border-info/20 bg-info-soft px-3 py-2.5 text-xs text-info">
            <Info size={15} aria-hidden className="mt-px shrink-0" />
            {p.hoursNote}
          </p>
        </div>
      </div>

      <fieldset className={box}>
        <legend className="sr-only">{p.breakTime}</legend>
        <p aria-hidden className="mb-3 text-sm font-semibold text-primary">
          {p.breakTime}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label={p.startTime} value={breakStart} onChange={(e) => setBreakStart(e.target.value)} options={optional} />
          <Select label={p.endTime} value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} options={optional} error={errors.break} />
        </div>
      </fieldset>

      <div className="flex flex-wrap justify-between gap-3">
        {secondary}
        <Button type="submit" loading={saving} className="ml-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
