"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Headset, House, MapPin, PackageCheck, Phone, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, Card, ErrorState, ListSkeleton, Modal, SectionTitle, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { customerApi } from "@/lib/api/endpoints";
import type { OrderDetail } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { RequireSession } from "@/features/auth/RequireSession";
import {
  DesignCard,
  MeasurementCard,
  OrderStatusChip,
  OrderThumb,
  OrderTimeline,
  PriceCard,
  formatVisit,
  latestEvents,
} from "@/features/orders/OrderParts";

const d = strings.orderDetail;
const a = strings.account;
const t = a.detail;
type DetailTab = keyof typeof t.tabs;

const outlineBtn =
  "inline-flex h-8 items-center gap-1.5 rounded-control border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-ring";

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding="none" className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-primary">{title}</h2>
      {children}
    </Card>
  );
}

function InfoLine({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-xs break-words text-muted">{children}</p>
      </div>
    </li>
  );
}

function Overview({ order }: { order: OrderDetail }) {
  const delivered = latestEvents(order.events).get("delivered");
  const rows: { label: string; value: ReactNode }[] = [
    { label: t.service, value: order.serviceName },
    { label: t.package, value: order.packageName },
    ...order.customizations.map((c) => ({ label: c.groupLabel, value: c.valueLabel })),
    { label: t.measurementMethod, value: strings.measurement[order.measurementMethod] },
    { label: t.tailor, value: order.tailor?.name ?? d.notAssigned },
    { label: t.total, value: formatMoney(order.total, order.currency) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 md:grid-cols-2">
        <InfoCard title={t.serviceInfo}>
          <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-xs leading-5 text-muted">{r.label}</dt>
                <dd className="text-sm leading-5 text-text">{r.value}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>
        <InfoCard title={t.pickupDelivery}>
          <ul className="flex flex-col gap-3">
            <InfoLine icon={MapPin} title={t.pickupAddress}>
              {order.address}, {order.city} {order.postalCode}
            </InfoLine>
            {order.measurementMethod === "visit" && (
              <InfoLine icon={CalendarClock} title={t.visitTime}>
                {formatVisit(order.visitDate, order.visitSlot)}
              </InfoLine>
            )}
            <InfoLine icon={Phone} title={t.contact}>
              {order.contactName} · {order.contactPhone}
              {order.contactEmail && ` · ${order.contactEmail}`}
            </InfoLine>
            <InfoLine icon={House} title={t.deliveryAddress}>
              {t.sameAsPickup}
            </InfoLine>
            {delivered && (
              <InfoLine icon={PackageCheck} title={strings.status.orderCustomer.delivered}>
                {formatDate(delivered.createdAt)}
              </InfoLine>
            )}
          </ul>
        </InfoCard>
      </div>
      {order.notes && (
        <InfoCard title={t.specialInstructions}>
          <p className="text-xs whitespace-pre-line text-muted">{order.notes}</p>
        </InfoCard>
      )}
    </div>
  );
}

function Detail({ id }: { id: number }) {
  const toast = useToast();
  const { data: order, status, reload, setData } = useApi(`order:${id}`, () => customerApi.order(id));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState<DetailTab>("overview");

  if (status === "loading") return <ListSkeleton rows={4} />;
  if (status === "error" || !order) return <ErrorState onRetry={reload} />;

  const cancellable = order.status === "placed" || order.status === "assigned";
  const delivered = latestEvents(order.events).get("delivered");
  const tabs = Object.keys(t.tabs) as DetailTab[];

  const cancel = async () => {
    setCancelling(true);
    try {
      setData(await customerApi.cancel(order.id));
      setConfirmOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            href={routes.account}
            className="inline-flex w-fit items-center gap-1.5 rounded-control text-xs text-text hover:text-accent focus-ring"
          >
            <ArrowLeft size={14} aria-hidden />
            {t.back}
          </Link>
          <h1 className="text-3xl">{t.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {cancellable && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={cn(outlineBtn, "border-border-strong bg-surface text-primary hover:border-accent hover:text-accent")}
            >
              <X size={14} aria-hidden />
              {d.cancel}
            </button>
          )}
          <Link
            href={routes.contact}
            className={cn(outlineBtn, "border-accent/40 bg-accent-soft text-accent hover:border-accent")}
          >
            <Headset size={14} aria-hidden />
            {t.needHelp}
          </Link>
        </div>
      </div>

      <Card padding="none" className="flex flex-wrap gap-4 p-4">
        <OrderThumb alt={order.serviceName} className="h-[72px] w-[92px]" />
        <div className="flex min-w-40 flex-1 flex-col gap-0.5">
          <p className="text-sm font-semibold text-primary">{a.orderId(order.id)}</p>
          <p className="text-xs text-text">
            {order.serviceName} – {order.packageName}
          </p>
          <p className="text-xs text-muted">{a.placedOn(formatDateTime(order.createdAt))}</p>
          {delivered && <p className="text-xs text-muted">{a.deliveredOn(formatDate(delivered.createdAt))}</p>}
        </div>
        <div className="shrink-0">
          <OrderStatusChip status={order.status} />
        </div>
      </Card>

      <div role="tablist" aria-label={t.title} className="flex overflow-x-auto border-b border-border [scrollbar-width:none]">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`detail-tab-${k}`}
            aria-selected={tab === k}
            aria-controls="detail-panel"
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px min-w-24 flex-1 border-b-2 px-3 pb-2.5 text-xs whitespace-nowrap transition-colors focus-ring",
              tab === k ? "border-accent font-semibold text-accent" : "border-transparent text-muted hover:text-primary",
            )}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="detail-panel" aria-labelledby={`detail-tab-${tab}`}>
        {tab === "overview" && <Overview order={order} />}
        {tab === "measurements" && <MeasurementCard order={order} />}
        {tab === "design" && <DesignCard order={order} />}
        {tab === "payment" && <PriceCard order={order} />}
        {tab === "timeline" && (
          <Card className="flex flex-col gap-4">
            <OrderProgress status={order.status} events={order.events} />
            <p className="rounded-control bg-blush-wash px-3 py-2 text-sm text-text">{strings.track.next[order.status]}</p>
            <div className="border-t border-border pt-4">
              <SectionTitle>{d.timeline}</SectionTitle>
              <OrderTimeline status={order.status} events={order.events} audience="customer" />
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={d.cancelTitle}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              {d.keep}
            </Button>
            <Button variant="danger" onClick={cancel} loading={cancelling}>
              {d.cancelConfirm}
            </Button>
          </>
        }
      >
        <p className="text-sm">{d.cancelBody}</p>
      </Modal>
    </div>
  );
}

export function CustomerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireSession role="customer" loginHref={routes.loginNext}>
      {() => <Detail id={Number(id)} />}
    </RequireSession>
  );
}
