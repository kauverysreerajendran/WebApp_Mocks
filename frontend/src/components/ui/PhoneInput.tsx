"use client";

import { ChevronDown } from "lucide-react";
import { COUNTRY_LIST, type CountryCode } from "@/config/countries";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { Field, controlClasses, controlState } from "./Field";

export interface PhoneValue {
  country: CountryCode;
  number: string;
}

interface PhoneInputProps {
  label?: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  name?: string;
}

export function PhoneInput({
  label = strings.fields.phone,
  value,
  onChange,
  onBlur,
  error,
  hint,
  disabled,
  name,
}: PhoneInputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <div className="flex gap-2">
          <div className="relative w-28 shrink-0">
            <select
              aria-label={strings.fields.countryCode}
              value={value.country}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, country: e.target.value as CountryCode })}
              className={cn(controlClasses, controlState(false), "h-10 appearance-none pr-8")}
            >
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.dialCode}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted"
            />
          </div>
          <input
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={value.number}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d]/g, "") })}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClasses, controlState(invalid), "h-10 min-w-0 flex-1")}
          />
        </div>
      )}
    </Field>
  );
}
