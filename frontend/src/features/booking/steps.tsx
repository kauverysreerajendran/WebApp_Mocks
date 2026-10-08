"use client";

import { CalendarClock, Check, Ruler } from "lucide-react";
import type { Dispatch, ReactNode } from "react";
import { OptionIllustration } from "@/components/garment/OptionIllustration";
import {
  ChoiceGroup,
  DateField,
  Photo,
  Input,
  PhoneInput,
  PriceTag,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { COUNTRY_LIST, getCountry } from "@/config/countries";
import { fallbackMedia, media, serviceMedia } from "@/config/media";
import { strings } from "@/i18n";
import type { BookingMeta, ServiceDetail, ServiceSummary } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { formatSlot } from "@/features/orders/OrderParts";
import { MEASUREMENT_MAX, isToggleOn, type Action, type BookingState, type ContactState } from "./state";

const b = strings.booking;

export function StepHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <h1 tabIndex={-1} data-step-heading className="text-2xl outline-none lg:text-3xl">
        {title}
      </h1>
      {lead && <p className="text-sm text-muted">{lead}</p>}
    </div>
  );
}

const priceDelta = (amount: number) => (amount > 0 ? `+${formatMoney(amount)}` : undefined);

// ---------- A2 Service ----------

export function ServiceStep({
  services,
  state,
  dispatch,
  error,
}: {
  services: ServiceSummary[];
  state: BookingState;
  dispatch: Dispatch<Action>;
  error?: string;
}) {
  return (
    <>
      <StepHeading title={b.serviceTitle} lead={b.serviceLead} />
      <ChoiceGroup
        legend={b.serviceTitle}
        hideLegend
        value={state.serviceSlug}
        onChange={(slug) => dispatch({ type: "selectService", slug })}
        error={error}
        variant="tile"
        columns="grid-cols-3 gap-2.5 md:grid-cols-5"
        choices={services.map((s) => ({
          value: s.slug,
          label: s.name,
          media: (
            <Photo
              image={serviceMedia[s.slug] ?? (s.slug.includes("custom") ? media.customDesign : fallbackMedia)}
              aspect="aspect-square"
              className="w-full"
              sizes="(min-width: 768px) 140px, 33vw"
              unoptimized
            />
          ),
        }))}
      />
    </>
  );
}

// ---------- A3 Package ----------

export function PackageStep({
  service,
  state,
  dispatch,
  error,
}: {
  service: ServiceDetail;
  state: BookingState;
  dispatch: Dispatch<Action>;
  error?: string;
}) {
  return (
    <>
      <StepHeading title={b.packageTitle} lead={b.packageLead(service.name)} />
      <ChoiceGroup
        legend={b.packageTitle}
        hideLegend
        value={state.packageId === null ? null : String(state.packageId)}
        onChange={(id) => dispatch({ type: "selectPackage", id: Number(id) })}
        error={error}
        columns="grid-cols-1 md:grid-cols-2"
        choices={service.packages.map((p) => ({
          value: String(p.id),
          label: p.name,
          description: p.description,
          meta: (
            <span className="flex flex-col items-end gap-1 text-xs text-muted">
              {strings.common.starting}
              <PriceTag>{formatMoney(p.basePrice)}</PriceTag>
            </span>
          ),
        }))}
      />
    </>
  );
}

// ---------- A4 Design ----------

export function DesignStep({
  service,
  state,
  dispatch,
  errors,
}: {
  service: ServiceDetail;
  state: BookingState;
  dispatch: Dispatch<Action>;
  errors: Record<string, string>;
}) {
  const choiceGroups = service.optionGroups.filter((g) => g.kind === "choice");
  const toggleGroups = service.optionGroups.filter((g) => g.kind === "toggle");
  return (
    <>
      <StepHeading title={b.designTitle(service.name)} lead={b.designLead} />
      <div className="flex flex-col gap-6">
        {choiceGroups.map((g) => (
          <ChoiceGroup
            key={g.key}
            legend={g.label}
            variant="tile"
            name={`group-${g.key}`}
            value={state.selections[g.key] ?? null}
            onChange={(option) => dispatch({ type: "select", group: g.key, option })}
            error={errors[g.key]}
            choices={g.options.map((o) => ({
              value: o.key,
              label: o.label,
              description: priceDelta(o.priceDelta),
              media: <OptionIllustration groupKey={g.key} optionKey={o.key} label={o.label} imageUrl={o.imageUrl} />,
            }))}
          />
        ))}
        {toggleGroups.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-primary">{b.toggleGroupTitle}</legend>
            <div className="divide-y divide-border rounded-card border border-border bg-surface px-3 shadow-card">
              {toggleGroups.map((g) => (
                <div key={g.key} className="flex items-center gap-3">
                  <Switch
                    className="flex-1"
                    label={g.label}
                    checked={isToggleOn(state, g)}
                    onChange={(value) => dispatch({ type: "toggle", group: g.key, value })}
                  />
                  {g.togglePrice > 0 && (
                    <span className="w-16 text-right text-xs text-muted">+{formatMoney(g.togglePrice)}</span>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </>
  );
}

// ---------- A5 Measurements ----------

function MethodCard({
  checked,
  onSelect,
  icon,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-card border p-3 pr-9 transition-[border-color,box-shadow,background-color] duration-200 ease-out-soft md:p-4 md:pr-10",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
        checked
          ? "border-accent bg-accent-soft ring-1 ring-accent"
          : "border-border bg-surface shadow-card hover:border-border-strong hover:shadow-lift",
      )}
    >
      <input type="radio" name="measurement-method" checked={checked} onChange={onSelect} className="sr-only" />
      {checked && (
        <span
          aria-hidden
          className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-accent text-on-accent"
        >
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
          checked ? "bg-surface text-accent" : "bg-accent-soft text-accent",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-primary">{title}</span>
        <span className="text-xs text-muted">{body}</span>
      </span>
    </label>
  );
}

export function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIsoDate(s: string | null): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function MeasurementStep({
  service,
  meta,
  state,
  dispatch,
  errors,
}: {
  service: ServiceDetail;
  meta: BookingMeta;
  state: BookingState;
  dispatch: Dispatch<Action>;
  errors: Record<string, string>;
}) {
  const hasFields = service.measurementFields.length > 0;
  const max = MEASUREMENT_MAX[state.unit];
  return (
    <>
      <StepHeading title={b.measureTitle} lead={b.measureLead} />
      <fieldset className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch" aria-describedby={errors.method ? "method-error" : undefined}>
        <legend className="sr-only">{b.measureLead}</legend>
        <MethodCard
          checked={state.method === "self"}
          onSelect={() => dispatch({ type: "method", method: "self" })}
          icon={<Ruler size={16} aria-hidden />}
          title={b.haveMeasurements}
          body={b.haveMeasurementsBody}
        />
        <p className="self-center text-center text-xs font-semibold text-muted">{b.or}</p>
        <MethodCard
          checked={state.method === "visit"}
          onSelect={() => dispatch({ type: "method", method: "visit" })}
          icon={<CalendarClock size={16} aria-hidden />}
          title={b.scheduleVisit}
          body={b.scheduleVisitBody}
        />
        {errors.method && (
          <p id="method-error" role="alert" className="text-xs text-error md:col-span-3">
            {errors.method}
          </p>
        )}
      </fieldset>

      {state.method === "self" && (
        <section className="mt-5 rounded-card border border-border bg-surface p-4 shadow-card">
          {hasFields ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold">{b.haveMeasurements}</h3>
                <div role="radiogroup" aria-label={b.unit} className="inline-flex rounded-control border border-border-strong bg-surface p-0.5">
                  {(["in", "cm"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      role="radio"
                      aria-checked={state.unit === u}
                      onClick={() => dispatch({ type: "unit", unit: u })}
                      className={cn(
                        "h-7 rounded-[6px] px-3 text-xs font-medium transition-colors focus-ring",
                        state.unit === u ? "bg-accent text-on-accent" : "text-text hover:bg-accent-soft",
                      )}
                    >
                      {u === "cm" ? b.cm : b.inch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {service.measurementFields.map((f) => (
                  <Input
                    key={f.key}
                    label={`${f.label} (${state.unit === "cm" ? b.cm : b.inch})`}
                    inputMode="decimal"
                    value={state.measurements[f.key] ?? ""}
                    onChange={(e) =>
                      dispatch({ type: "measurement", key: f.key, value: e.target.value.replace(/[^\d.]/g, "") })
                    }
                    error={
                      errors[f.key] === "required"
                        ? strings.validation.required(f.label)
                        : errors[f.key]
                          ? `${strings.validation.positive} (≤ ${max})`
                          : undefined
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">{b.noMeasurementsNeeded}</p>
          )}
        </section>
      )}

      {state.method === "visit" && (
        <section className="mt-5 grid gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-[auto_1fr]">
          <DateField
            label={strings.fields.date}
            value={fromIsoDate(state.visitDate)}
            onChange={(d) => dispatch({ type: "visit", date: d ? toIsoDate(d) : null })}
            disablePast
            maxDays={meta.maxAdvanceDays}
            error={errors.visitDate}
            inline
          />
          <Select
            label={b.visitSlot}
            placeholder={strings.datePicker.timePlaceholder}
            value={state.visitSlot ?? ""}
            onChange={(e) => dispatch({ type: "visit", slot: e.target.value || null })}
            options={meta.visitSlots.map((s) => ({ value: s, label: formatSlot(s) }))}
            error={errors.visitSlot}
            hint={meta.visitFee ? `${strings.measurement.visit}: ${formatMoney(meta.visitFee)}` : undefined}
          />
        </section>
      )}
    </>
  );
}

// ---------- A6 Customer details ----------

export type ContactErrors = Partial<Record<keyof ContactState, string>>;

export function DetailsStep({
  state,
  dispatch,
  errors,
}: {
  state: BookingState;
  dispatch: Dispatch<Action>;
  errors: ContactErrors;
}) {
  const c = state.contact;
  const country = getCountry(c.country);
  const postalLabel = strings.fields[country.postalLabelKey];
  const patch = (p: Partial<ContactState>) => dispatch({ type: "contact", patch: p });
  return (
    <>
      <StepHeading title={b.detailsTitle} lead={b.detailsLead} />
      <div className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-2">
        <Input
          label={strings.fields.name}
          value={c.name}
          onChange={(e) => patch({ name: e.target.value })}
          error={errors.name}
          autoComplete="name"
        />
        <PhoneInput
          value={{ country: c.phoneCountry, number: c.phone }}
          onChange={(v) => patch({ phone: v.number, phoneCountry: v.country })}
          error={errors.phone}
        />
        <Input
          label={strings.fields.email}
          type="email"
          value={c.email}
          onChange={(e) => patch({ email: e.target.value })}
          error={errors.email}
          autoComplete="email"
          containerClassName="md:col-span-2"
        />
        <Textarea
          label={strings.fields.address}
          hint={strings.fields.addressHint}
          rows={3}
          value={c.address}
          onChange={(e) => patch({ address: e.target.value })}
          error={errors.address}
          autoComplete="street-address"
          containerClassName="md:col-span-2"
        />
        <Input
          label={strings.fields.city}
          value={c.city}
          onChange={(e) => patch({ city: e.target.value })}
          error={errors.city}
          autoComplete="address-level2"
        />
        <Input
          label={postalLabel}
          value={c.postalCode}
          onChange={(e) => patch({ postalCode: e.target.value })}
          error={errors.postalCode}
          autoComplete="postal-code"
          inputMode={c.country === "IN" ? "numeric" : "text"}
        />
        <Select
          label={strings.fields.country}
          value={c.country}
          onChange={(e) => patch({ country: e.target.value as ContactState["country"] })}
          options={COUNTRY_LIST.map((x) => ({ value: x.code, label: x.name }))}
        />
        <Textarea
          label={strings.fields.notes}
          hint={strings.fields.notesHint}
          optional
          rows={3}
          value={state.notes}
          onChange={(e) => dispatch({ type: "notes", value: e.target.value })}
          containerClassName="md:col-span-2"
        />
      </div>
    </>
  );
}
