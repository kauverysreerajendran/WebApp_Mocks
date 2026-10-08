"use client";

import { CalendarDays, ChevronRight, MapPin, Phone, Ruler, Scissors, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink, Card, DataState, Input, Photo, type BadgeTone } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { ApiError, errorMessage } from "@/lib/api/client";
import { customerApi, trackApi } from "@/lib/api/endpoints";
import type { OrderStatus, TrackResult } from "@/lib/api/types";
import { useSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { cn } from "@/lib/cn";
import { ORDER_TONE, isActiveOrder } from "@/lib/status";
import { OrderTimeline, formatVisit } from "@/features/orders/OrderParts";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { orderThumbImage } from "./trackMedia";

const t = strings.track;

function LookupForm({ onFound }: { onFound: (result: TrackResult) => void }) {
  const params = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ orderNo?: string; phone?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(orderNo.replace(/^#/, "").trim());
    const digits = phone.replace(/\D/g, "");
    const errs = {
      orderNo: Number.isInteger(id) && id > 0 ? undefined : t.invalidOrder,
      phone: digits.length >= 6 ? undefined : strings.validation.phone,
    };
    setErrors(errs);
    if (errs.orderNo || errs.phone) return;
    setPending(true);
    try {
      onFound(await trackApi.lookup(id, digits));
    } catch (err) {
      setErrors({ form: err instanceof ApiError && err.status === 404 ? t.notFound : errorMessage(err) });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid items-start gap-2 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto]"
      >
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute top-3 left-3 text-muted" />
          <Input
            label={t.orderNo}
            hideLabel
            placeholder={t.orderNoPlaceholder}
            inputMode="numeric"
            autoComplete="off"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            error={errors.orderNo}
            className="pl-9 shadow-card"
          />
        </div>
        <div className="relative">
          <Phone size={16} aria-hidden className="pointer-events-none absolute top-3 left-3 text-muted" />
          <Input
            label={t.phone}
            hideLabel
            placeholder={t.phonePlaceholder}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            className="pl-9 shadow-card"
          />
        </div>
        <Button type="submit" loading={pending} className="min-w-24 px-7">
          {t.submit}
        </Button>
      </form>
      {errors.form && (
        <p role="alert" className="rounded-control bg-error-soft px-3 py-2 text-sm text-error">
          {errors.form}
        </p>
      )}
    </div>
  );
}

/** Soft rectangular status chip (mock: amber "In Stitching"); in-progress stages read as amber. */
const CHIP_TONE: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  info: "bg-warning-soft text-warning-strong",
  warning: "bg-warning-soft text-warning-strong",
  success: "bg-success-soft text-success",
  error: "bg-error-soft text-error",
  accent: "bg-accent-soft text-accent-strong",
};

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-control px-3 py-1.5 text-xs font-medium whitespace-nowrap", CHIP_TONE[ORDER_TONE[status]])}>
      {strings.status.orderCustomer[status]}
    </span>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={14} aria-hidden className="shrink-0 text-accent" />
      <div className="min-w-0 text-xs">
        <dt className="sr-only">{label}</dt>
        <dd className="truncate text-text" title={`${label}: ${value}`}>
          <span className="text-muted">{label}: </span>
          {value}
        </dd>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: TrackResult }) {
  const method =
    result.measurementMethod === "visit"
      ? `${strings.measurement.visit} · ${formatVisit(result.visitDate, result.visitSlot)}`
      : strings.measurement.self;
  const latest = result.events.reduce<TrackResult["events"][number] | undefined>(
    (acc, e) => (!acc || new Date(e.createdAt) >= new Date(acc.createdAt) ? e : acc),
    undefined,
  );
  const delivered = result.status === "delivered";
  const dateLabel = delivered ? t.deliveredOn : t.lastUpdate;
  const dateValue = latest?.createdAt ?? result.createdAt;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="flex flex-col gap-5 p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <Photo image={orderThumbImage(result.serviceName)} sizes="96px" className="h-14 w-20 shrink-0 rounded-control" />
          <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-semibold text-primary">
                {t.orderId} {strings.common.orderNo(result.id)}
              </p>
              <h2 className="text-sm font-normal text-text">
                {result.serviceName} – {result.packageName}
              </h2>
              <p className="text-xs text-muted">
                {t.placed} {formatDate(result.createdAt)}
              </p>
            </div>
            <StatusChip status={result.status} />
          </div>
        </div>
        <OrderProgress status={result.status} events={result.events} summary={false} />
      </Card>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <Card padding="sm" className="flex flex-col gap-2.5 md:p-4">
          <h2 className="text-sm font-semibold text-primary">{t.currentStatus}</h2>
          <div className="flex items-start gap-3">
            <Photo image={media.stitching} sizes="96px" className="h-16 w-20 shrink-0 rounded-control" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className={cn("text-sm font-semibold", result.status === "cancelled" ? "text-error" : "text-primary")}>
                {strings.status.orderCustomer[result.status]}
              </p>
              <p className="text-xs text-muted">{t.next[result.status]}</p>
            </div>
          </div>
          <dl className="mt-1 grid gap-x-4 gap-y-1.5 border-t border-border pt-2.5 sm:grid-cols-2">
            <Fact icon={Scissors} label={t.tailor} value={result.tailorName ?? t.tailorPending} />
            <Fact icon={MapPin} label={t.city} value={result.city} />
            <Fact icon={Ruler} label={t.method} value={method} />
          </dl>
        </Card>
        <Card padding="sm" className="flex items-center gap-3 md:p-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CalendarDays size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">{dateLabel}</p>
            <p className="text-lg font-semibold text-primary">{formatDate(dateValue)}</p>
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <Card padding="sm" className="md:p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t.history}</h2>
          <OrderTimeline status={result.status} events={result.events} audience="customer" />
        </Card>
        <Card padding="sm" className="flex flex-col items-start gap-2 bg-blush-wash md:p-4">
          <h2 className="text-sm font-semibold text-primary">{t.fullDetails}</h2>
          <p className="text-xs text-muted">{t.fullDetailsBody}</p>
          <ButtonLink href={routes.loginNext(routes.accountOrder(result.id))} size="sm" className="mt-1">
            {t.fullDetails}
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}

/** Signed-in customers see their live orders without typing anything. */
function ActiveOrders() {
  const { data, status, reload } = useApi("my-orders", customerApi.orders);
  return (
    <Card padding="sm" className="flex flex-col gap-3 md:p-4">
      <div>
        <h2 className="text-sm font-semibold text-primary">{t.yourActive}</h2>
        <p className="text-xs text-muted">{t.yourActiveLead}</p>
      </div>
      <DataState
        status={status}
        data={data?.filter((o) => isActiveOrder(o.status))}
        onRetry={reload}
        empty={
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs text-muted">{t.noneActive}</p>
            <ButtonLink href={routes.book} size="sm">
              {t.bookCta}
            </ButtonLink>
          </div>
        }
      >
        {(orders) => (
          <ul className="flex flex-col gap-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={routes.accountOrder(o.id)}
                  className="flex items-center gap-3 rounded-control border border-border p-3 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-lift focus-ring"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-sm font-medium text-text">
                      <span className="font-semibold text-primary">{strings.common.orderNo(o.id)}</span> · {o.serviceName}
                    </p>
                    <OrderProgress status={o.status} compact />
                  </div>
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DataState>
    </Card>
  );
}

export function TrackOrder() {
  const session = useSession("customer");
  const [result, setResult] = useState<TrackResult | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <LookupForm onFound={setResult} />
      <div className={cn("grid items-start gap-4", session && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        {result ? <ResultView key={result.id} result={result} /> : <TrackPreview />}
        {session && <ActiveOrders />}
      </div>
    </div>
  );
}

/** Empty-state illustration of what the tracker shows, using the real stage names. */
function TrackPreview() {
  return (
    <Card padding="none" className="hidden flex-col gap-5 p-5 lg:flex">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">{t.eyebrow}</p>
        <h2 className="text-sm font-semibold text-primary">{t.progress}</h2>
      </div>
      <OrderProgress status="stitching" summary={false} />
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {(["placed", "accepted", "measurement_done", "stitching", "ready", "delivered"] as const).map((s) => (
          <li key={s} className="flex flex-col gap-0.5 rounded-control bg-surface-muted p-3">
            <span className="text-sm font-medium text-primary">{strings.status.orderCustomer[s]}</span>
            <span className="text-xs text-muted">{t.next[s]}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
