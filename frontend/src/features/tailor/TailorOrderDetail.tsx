"use client";

import { ArrowLeft, Check, CircleCheckBig, MessageCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ButtonLink, ErrorState, ListSkeleton, PriceTag } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderDetail } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { nextTailorStatus } from "@/lib/status";
import { MeasurementCard, OrderThumb, formatVisit } from "@/features/orders/OrderParts";
import { useOrderDecision } from "./OrdersList";
import { STAGE_FLOW, STAGE_OF, StageBadge, dueDateOf, panel, type Stage } from "./portal";

const t = strings.tailor;
const p = strings.tailorPortal;

/** When each stage was first reached, from the order's event history. */
export function stageTimes(order: OrderDetail): Map<Stage, string> {
  const times = new Map<Stage, string>();
  for (const e of order.events) {
    const stage = STAGE_OF[e.status];
    if (!times.has(stage) || e.status === "assigned") times.set(stage, e.createdAt);
  }
  return times;
}

/** Vertical New → Accepted → In Progress → Ready for Pickup → Completed timeline. */
function StatusTimeline({ order }: { order: OrderDetail }) {
  const reached = STAGE_FLOW.indexOf(STAGE_OF[order.status]);
  const times = stageTimes(order);
  return (
    <ol className="flex flex-col">
      {STAGE_FLOW.map((stage, i) => {
        const done = i < reached;
        const current = i === reached;
        return (
          <li key={stage} className="relative flex gap-3 pb-4 last:pb-0">
            {i < STAGE_FLOW.length - 1 && (
              <span aria-hidden className={cn("absolute top-5 left-[9px] h-[calc(100%-1.25rem)] w-px", done ? "bg-accent" : "bg-border")} />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 inline-flex size-[19px] shrink-0 items-center justify-center rounded-full border-2",
                done ? "border-accent bg-accent text-on-accent" : current ? "border-accent bg-surface" : "border-border-strong bg-surface",
              )}
            >
              {done ? <Check size={11} strokeWidth={3} /> : current && <span className="size-2 rounded-full bg-accent" />}
            </span>
            <span className="flex flex-col leading-tight">
              <span className={cn("text-sm", current ? "font-semibold text-accent" : done ? "text-text" : "text-muted")}>{p.stages[stage]}</span>
              {(done || current) && times.get(stage) && <span className="text-xs text-muted">{formatDateTime(times.get(stage)!)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-text">{children}</dd>
    </div>
  );
}

/** Order Details (reference screen 3). */
export function TailorOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const { data: order, status, reload } = useApi(`tailor-order:${orderId}`, () => tailorApi.order(orderId));
  const decision = useOrderDecision((accepted) => (accepted ? reload() : router.replace(routes.tailor.orders)));

  if (status === "loading") return <ListSkeleton rows={4} />;
  if (status === "error" || !order) return <ErrorState onRetry={reload} />;

  const advance = order.payment?.status === "paid" ? order.payment.amount : 0;
  const canUpdate = Boolean(nextTailorStatus(order.status));
  const s = order.settlement;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href={routes.tailor.orders} aria-label={p.back} className="inline-flex size-8 items-center justify-center rounded-control text-text hover:bg-surface-muted focus-ring">
            <ArrowLeft size={18} aria-hidden />
          </Link>
          <h1 className="text-2xl">{p.orderTitle(order.id)}</h1>
        </div>
        <StageBadge status={order.status} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-4">
          <section className={cn(panel, "p-4")}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <OrderThumb alt={order.serviceName} className="aspect-[4/5] w-full sm:w-36" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <h2 className="text-base">
                    {order.serviceName} · {order.packageName}
                  </h2>
                  <p className="text-lg font-semibold text-primary">{formatMoney(order.total, order.currency)}</p>
                </div>
                <dl className="flex flex-col gap-1.5">
                  <Detail label={t.customer}>{order.contactName}</Detail>
                  <Detail label={p.phone}>
                    <a href={`tel:${order.contactPhone}`} className="rounded-control text-accent hover:underline focus-ring">
                      {order.contactPhone}
                    </a>
                  </Detail>
                  <Detail label={p.orderDate}>{formatDate(order.createdAt)}</Detail>
                  <Detail label={p.dueDate}>{formatDate(dueDateOf(order))}</Detail>
                  <Detail label={p.pieces}>{p.oneSet}</Detail>
                  <Detail label={p.measurements}>
                    {order.measurementMethod === "visit" ? p.measurementsVisit(formatVisit(order.visitDate, order.visitSlot)) : p.measurementsProvided}
                  </Detail>
                  <Detail label={strings.fields.address}>
                    {order.address}, {order.city} {order.postalCode}
                  </Detail>
                  {order.notes && <Detail label={p.specialNote}>{order.notes}</Detail>}
                </dl>
              </div>
            </div>
          </section>

          <section className={cn(panel, "p-4")} aria-labelledby="design-title">
            <h2 id="design-title" className="mb-2.5 text-sm font-semibold">
              {p.designChoices}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {order.customizations.map((c) => (
                <li key={c.groupKey} className="rounded-control border border-border bg-surface-muted px-2.5 py-1.5 text-xs">
                  <span className="text-muted">{c.groupLabel}: </span>
                  <span className="font-medium text-text">{c.valueLabel}</span>
                </li>
              ))}
            </ul>
          </section>

          <MeasurementCard order={order} />
        </div>

        <aside className="flex flex-col gap-4">
          {order.status === "assigned" && (
            <section className={cn(panel, "flex flex-col gap-3 p-4")}>
              <p className="text-sm text-text">{t.newOrderPrompt}</p>
              <div className="flex gap-2">{decision.actions(order)}</div>
            </section>
          )}

          <section className={cn(panel, "p-4")} aria-labelledby="status-title">
            <h2 id="status-title" className="mb-3 text-sm font-semibold">
              {t.orderStatusTitle}
            </h2>
            <StatusTimeline order={order} />
          </section>

          <section className={cn(panel, "p-4")}>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{p.estimatedPrice}</dt>
                <dd className="font-medium">{formatMoney(order.total, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{p.advancePaid}</dt>
                <dd>{formatMoney(advance, order.currency)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="font-semibold text-primary">{p.balance}</dt>
                <dd>
                  <PriceTag>{formatMoney(order.total - advance, order.currency)}</PriceTag>
                </dd>
              </div>
              {s && (
                <div className="flex items-center justify-between border-t border-border pt-2 text-success">
                  <dt className="inline-flex items-center gap-1.5 font-medium">
                    <CircleCheckBig size={14} aria-hidden /> {t.yourEarning}
                  </dt>
                  <dd className="font-semibold">{formatMoney(s.net, order.currency)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              {canUpdate && (
                <ButtonLink href={routes.tailor.orderStatus(order.id)} fullWidth leftIcon={<RefreshCw size={15} aria-hidden />}>
                  {p.updateStatus}
                </ButtonLink>
              )}
              <ButtonLink href={`tel:${order.contactPhone}`} variant="secondary" fullWidth leftIcon={<MessageCircle size={15} aria-hidden />}>
                {p.chatCustomer}
              </ButtonLink>
            </div>
          </section>
        </aside>
      </div>
      {decision.dialog}
    </div>
  );
}
