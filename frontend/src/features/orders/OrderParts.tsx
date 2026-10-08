import { Check, CircleX, Mail, MapPin, Phone, User } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Card, Photo, SectionTitle } from "@/components/ui";
import { media, serviceMedia, type MediaImage } from "@/config/media";
import { strings } from "@/i18n";
import type { OrderDetail, OrderEvent, OrderStatus, PaymentStatus, Role } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { ORDER_FLOW, ORDER_TONE, PAYMENT_TONE } from "@/lib/status";

export function OrderStatusBadge({ status, audience = "staff" }: { status: OrderStatus; audience?: "customer" | "staff" }) {
  const label = audience === "customer" ? strings.status.orderCustomer[status] : strings.status.order[status];
  return <Badge tone={ORDER_TONE[status]}>{label}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{strings.status.payment[status]}</Badge>;
}

/** Customer-facing status chip (mock style): amber while in progress, green delivered, red cancelled. */
export function OrderStatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  const tone =
    status === "delivered"
      ? "bg-success-soft text-success"
      : status === "cancelled"
        ? "bg-error-soft text-error"
        : "bg-warning-soft text-warning-strong";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-3 py-1 text-xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      {strings.status.orderCustomer[status]}
    </span>
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Pick a garment photo for an order from its service name. */
export function orderMedia(serviceName: string): MediaImage {
  const name = serviceName.toLowerCase();
  if (name.includes("blouse")) return serviceMedia["blouse-stitching"];
  if (name.includes("kurt")) return serviceMedia["kurti-kurta"];
  if (name.includes("saree")) return serviceMedia["saree-services"];
  if (name.includes("men")) return serviceMedia["mens-wear"];
  if (name.includes("alter")) return serviceMedia.alterations;
  return serviceMedia[slugify(serviceName)] ?? media.customDesign;
}

/**
 * Small rounded garment thumbnail for order rows and headers. `alt` doubles as the
 * service name used to choose the photo unless `service` is given.
 * `className` replaces the default 70×56 size.
 */
export function OrderThumb({ alt, service, className }: { alt: string; service?: string; className?: string }) {
  const image = orderMedia(service ?? alt);
  return (
    <Photo
      image={{ src: image.src, alt }}
      sizes="96px"
      unoptimized
      className={cn("shrink-0 rounded-control border border-border", className ?? "h-14 w-[70px]")}
    />
  );
}

/** "11:00-13:00" → "11:00 am – 1:00 pm" (locale aware). */
export function formatSlot(slot: string | null): string {
  if (!slot) return strings.common.na;
  const [from, to] = slot.split("-");
  return to ? `${formatClock(from)} – ${formatClock(to)}` : formatClock(from);
}

export function formatVisit(date: string | null, slot: string | null): string {
  if (!date) return strings.common.na;
  return `${formatDate(date, { weekday: "short", day: "numeric", month: "short" })} · ${formatSlot(slot)}`;
}

/** Timeline input: full staff events, or the public tracker's status + time only. */
export type TimelineEvent = Pick<OrderEvent, "status" | "createdAt"> & Partial<Pick<OrderEvent, "actorRole" | "note">>;

export function latestEvents(events: TimelineEvent[]) {
  const map = new Map<OrderStatus, TimelineEvent>();
  events.forEach((e) => map.set(e.status, e));
  return map;
}

interface TimelineProps {
  status: OrderStatus;
  events: TimelineEvent[];
  audience: "customer" | "staff";
}

/**
 * Status timeline. Shows every stage of the standard flow; reached stages carry the
 * timestamp of the latest event for that status (re-assignments keep the newest).
 */
export function OrderTimeline({ status, events, audience }: TimelineProps) {
  const labels = audience === "customer" ? strings.status.orderCustomer : strings.status.order;
  const actorLabels: Record<Role, string> = audience === "customer" ? strings.orderDetail.by : strings.orderDetail.actor;
  const lastEvent = latestEvents(events);

  if (status === "cancelled") {
    const cancelled = lastEvent.get("cancelled");
    return (
      <ol className="flex flex-col gap-3">
        <li className="flex gap-3">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
            <CircleX size={16} aria-hidden />
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-medium text-text">{labels.cancelled}</p>
            {cancelled && (
              <p className="text-xs text-muted">
                {formatDateTime(cancelled.createdAt)}
                {cancelled.actorRole && ` · ${actorLabels[cancelled.actorRole]}`}
              </p>
            )}
          </div>
        </li>
      </ol>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(status);
  return (
    <ol className="flex flex-col">
      {ORDER_FLOW.map((stage, i) => {
        const done = i < currentIndex || status === "delivered";
        const active = i === currentIndex && status !== "delivered";
        const event = i <= currentIndex ? lastEvent.get(stage) : undefined;
        return (
          <li key={stage} className="relative flex gap-3 pb-4 last:pb-0">
            {i < ORDER_FLOW.length - 1 && (
              <span
                aria-hidden
                className={cn("absolute top-7 bottom-0 left-3.5 w-px -translate-x-1/2", done ? "bg-accent" : "bg-border-strong")}
              />
            )}
            <span
              className={cn(
                "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                done && "border-accent bg-accent text-on-accent",
                active && "border-accent bg-surface text-accent",
                !done && !active && "border-border-strong bg-surface text-muted",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-medium", done || active ? "text-text" : "text-muted")}>{labels[stage]}</p>
              {event && (
                <p className="text-xs text-muted">
                  {formatDateTime(event.createdAt)}
                  {audience === "staff" && event.actorRole && ` · ${actorLabels[event.actorRole]}`}
                </p>
              )}
              {event?.note && <p className="mt-1 text-xs text-text">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Rows({ rows }: { rows: { label: string; value: ReactNode; strong?: boolean }[] }) {
  return (
    <dl className="flex flex-col divide-y divide-border">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-sm text-muted">{r.label}</dt>
          <dd className={cn("text-right text-sm", r.strong ? "font-semibold text-primary" : "text-text")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DesignCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <SectionTitle>{strings.orderDetail.design}</SectionTitle>
      <Rows
        rows={[
          { label: strings.booking.sectionService, value: `${order.serviceName} · ${order.packageName}` },
          ...order.customizations.map((c) => ({
            label: c.groupLabel,
            value: c.price ? `${c.valueLabel} (+${formatMoney(c.price)})` : c.valueLabel,
          })),
        ]}
      />
      {order.notes && (
        <div className="mt-3 rounded-control bg-surface-muted p-3 text-sm">
          <p className="font-medium text-text">{strings.orderDetail.notes}</p>
          <p className="text-muted">{order.notes}</p>
        </div>
      )}
    </Card>
  );
}

export function MeasurementCard({ order }: { order: OrderDetail }) {
  const entries = Object.entries(order.measurements ?? {});
  return (
    <Card>
      <SectionTitle>
        {order.measurementMethod === "visit" ? strings.orderDetail.visit : strings.orderDetail.measurements}
      </SectionTitle>
      {order.measurementMethod === "visit" ? (
        <Rows
          rows={[
            { label: strings.fields.date, value: formatVisit(order.visitDate, order.visitSlot) },
            {
              label: strings.orderDetail.executive,
              value: order.executive
                ? `${order.executive.name}${order.executive.phone ? ` · ${order.executive.phone}` : ""}`
                : strings.orderDetail.notAssigned,
            },
          ]}
        />
      ) : entries.length ? (
        <Rows
          rows={entries.map(([key, value]) => ({
            label: order.measurementLabels[key] ?? key,
            value: `${value} ${order.measurementUnit ?? ""}`.trim(),
          }))}
        />
      ) : (
        <p className="text-sm text-muted">{strings.booking.noMeasurementsNeeded}</p>
      )}
    </Card>
  );
}

export function PriceCard({ order, showPayment = true }: { order: OrderDetail; showPayment?: boolean }) {
  const extras = order.customizations.filter((c) => c.price > 0);
  return (
    <Card>
      <SectionTitle action={showPayment && order.payment ? <PaymentBadge status={order.payment.status} /> : undefined}>
        {strings.orderDetail.price}
      </SectionTitle>
      <Rows
        rows={[
          { label: order.packageName, value: formatMoney(order.packagePrice, order.currency) },
          ...extras.map((c) => ({ label: `${c.groupLabel}: ${c.valueLabel}`, value: formatMoney(c.price, order.currency) })),
          ...(order.visitFee ? [{ label: strings.orderDetail.visit, value: formatMoney(order.visitFee, order.currency) }] : []),
          { label: strings.common.total, value: formatMoney(order.total, order.currency), strong: true },
        ]}
      />
    </Card>
  );
}

export function ContactCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <SectionTitle>{strings.orderDetail.contact}</SectionTitle>
      <address className="flex flex-col gap-2 text-sm not-italic">
        <ContactLine icon={User}>
          <span className="font-medium text-text">{order.contactName}</span>
        </ContactLine>
        <ContactLine icon={Phone}>{order.contactPhone}</ContactLine>
        {order.contactEmail && <ContactLine icon={Mail}>{order.contactEmail}</ContactLine>}
        <ContactLine icon={MapPin}>
          {order.address}, {order.city} {order.postalCode}
        </ContactLine>
      </address>
    </Card>
  );
}

function ContactLine({ icon: Icon, children }: { icon: typeof MapPin; children: ReactNode }) {
  return (
    <span className="flex items-start gap-2.5 text-text">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
        <Icon size={14} aria-hidden />
      </span>
      <span className="min-w-0 pt-1 break-words">{children}</span>
    </span>
  );
}
