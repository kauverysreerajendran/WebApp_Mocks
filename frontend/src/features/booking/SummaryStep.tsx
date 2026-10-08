"use client";

import type { ReactNode } from "react";
import { Button, Card, ErrorState, PriceTag, Skeleton } from "@/components/ui";
import { getCountry } from "@/config/countries";
import { strings } from "@/i18n";
import { catalogApi } from "@/lib/api/endpoints";
import type { BookingMeta, ServiceDetail } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { formatVisit } from "@/features/orders/OrderParts";
import { STEP, isToggleOn, toDraft, type BookingState, type StepIndex } from "./state";
import { StepHeading } from "./steps";

const b = strings.booking;

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Card padding="sm" className="md:p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button variant="text" size="sm" onClick={onEdit} aria-label={`${strings.common.edit} ${title}`}>
          {strings.common.edit}
        </Button>
      </div>
      {children}
    </Card>
  );
}

function Pairs({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-4 gap-y-1.5 text-xs md:text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="text-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SummaryStep({
  service,
  meta,
  state,
  onEdit,
}: {
  service: ServiceDetail;
  meta: BookingMeta;
  state: BookingState;
  onEdit: (step: StepIndex) => void;
}) {
  const draft = toDraft(state, service);
  const quote = useApi(`quote:${JSON.stringify(draft)}`, () => catalogApi.quote(draft));
  const pkg = service.packages.find((p) => p.id === state.packageId);
  const c = state.contact;
  const country = getCountry(c.country);

  return (
    <>
      <StepHeading title={b.summaryTitle} lead={b.summaryLead} />
      <div className="flex flex-col gap-3">
        <Section title={b.sectionService} onEdit={() => onEdit(STEP.package)}>
          <Pairs items={[[b.sectionService, service.name], [b.packageTitle, `${pkg?.name} · ${pkg?.description}`]]} />
        </Section>

        <Section title={b.sectionDesign} onEdit={() => onEdit(STEP.design)}>
          <Pairs
            items={service.optionGroups.map((g) => [
              g.label,
              g.kind === "choice"
                ? (g.options.find((o) => o.key === state.selections[g.key])?.label ?? strings.common.na)
                : isToggleOn(state, g)
                  ? strings.common.yes
                  : strings.common.no,
            ])}
          />
        </Section>

        <Section title={b.sectionMeasurements} onEdit={() => onEdit(STEP.measurements)}>
          {state.method === "visit" ? (
            <Pairs
              items={[
                [b.scheduleVisit, formatVisit(state.visitDate, state.visitSlot)],
              ]}
            />
          ) : service.measurementFields.length ? (
            <Pairs
              items={service.measurementFields.map((f) => [
                f.label,
                `${state.measurements[f.key]} ${state.unit === "cm" ? b.cm : b.inch}`,
              ])}
            />
          ) : (
            <p className="text-sm text-muted">{b.noMeasurementsNeeded}</p>
          )}
        </Section>

        <Section title={b.sectionAddress} onEdit={() => onEdit(STEP.details)}>
          <Pairs
            items={[
              [strings.fields.name, c.name],
              [strings.fields.phone, `${getCountry(c.phoneCountry).dialCode} ${c.phone}`],
              [strings.fields.email, c.email],
              [
                strings.fields.address,
                `${c.address}, ${c.city} ${c.postalCode}, ${country.name}`,
              ],
              ...(state.notes.trim() ? ([[strings.fields.notes, state.notes]] as [string, ReactNode][]) : []),
            ]}
          />
        </Section>

        <Card padding="sm" className="md:p-4">
          <h2 className="mb-2 text-sm font-semibold">{b.priceBreakdown}</h2>
          {quote.status === "loading" && (
            <div className="flex flex-col gap-2" role="status" aria-label={strings.common.loading}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {quote.status === "error" && <ErrorState title={b.errorQuote} body={quote.error} onRetry={quote.reload} />}
          {quote.data && (
            <>
              <ul className="flex flex-col divide-y divide-border text-sm">
                {quote.data.lines.map((l) => (
                  <li key={`${l.label}-${l.detail}`} className="flex justify-between gap-4 py-1.5">
                    <span className="text-text">
                      {l.label}
                      {l.detail && <span className="text-muted"> · {l.detail}</span>}
                    </span>
                    <span className="whitespace-nowrap">{formatMoney(l.amount, quote.data!.currency)}</span>
                  </li>
                ))}
                {state.method === "visit" && !meta.visitFee && (
                  <li className="flex justify-between gap-4 py-1.5">
                    <span>{strings.measurement.visit}</span>
                    <span className="text-success">{strings.common.free}</span>
                  </li>
                )}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-primary">{strings.common.total}</span>
                <PriceTag size="lg">{formatMoney(quote.data.total, quote.data.currency)}</PriceTag>
              </div>
              <p className="mt-2 text-xs text-muted">{b.payOnDelivery}</p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
