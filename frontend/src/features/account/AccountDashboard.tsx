"use client";

import {
  ArrowRight,
  CirclePlus,
  LifeBuoy,
  LogOut,
  Ruler,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Button,
  ButtonLink,
  Card,
  DataState,
  EmptyState,
  Input,
  Photo,
  Textarea,
  useToast,
} from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { authApi, customerApi } from "@/lib/api/endpoints";
import type { OrderListItem, User } from "@/lib/api/types";
import { sessions, type Session } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { isActiveOrder } from "@/lib/status";
import { compact, isEmail } from "@/lib/validation";
import { RequireSession } from "@/features/auth/RequireSession";
import { OrderStatusChip, OrderThumb, formatVisit } from "@/features/orders/OrderParts";

const a = strings.account;
type Tab = keyof typeof a.tabs;

function OrderRow({ order: o }: { order: OrderListItem }) {
  return (
    <Link href={routes.accountOrder(o.id)} className="group block rounded-card focus-ring">
      <Card padding="none" interactive className="flex flex-col gap-3 p-4 md:flex-row md:gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <OrderThumb alt={o.serviceName} className="h-[60px] w-[76px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm font-semibold text-primary">{a.orderId(o.id)}</p>
            <p className="truncate text-xs text-text">
              {o.serviceName} – {o.packageName}
            </p>
            <p className="text-xs text-muted">{a.placedOn(formatDate(o.createdAt))}</p>
            {o.measurementMethod === "visit" && isActiveOrder(o.status) && (
              <p className="text-xs text-muted">
                {strings.measurement.visit}: {formatVisit(o.visitDate, o.visitSlot)}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 md:flex-col md:flex-nowrap md:items-end">
          <OrderStatusChip status={o.status} />
          <span className="inline-flex h-7 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-2.5 text-xs font-medium whitespace-nowrap text-primary transition-colors group-hover:border-accent group-hover:text-accent">
            {a.viewDetails}
            <ArrowRight size={12} aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}

function OrdersTab({ onMeasurements }: { onMeasurements: () => void }) {
  const { data, status, reload } = useApi("my-orders", customerApi.orders);
  return (
    <div className="flex flex-col gap-5">
      <DataState
        status={status}
        data={data}
        onRetry={reload}
        empty={
          <EmptyState
            icon={ShoppingBag}
            title={a.noOrdersTitle}
            body={a.noOrdersBody}
            action={<ButtonLink href={routes.book}>{a.bookFirst}</ButtonLink>}
          />
        }
      >
        {(orders) => <OrderLists orders={orders} />}
      </DataState>
      <MeasurementsPromo onClick={onMeasurements} />
    </div>
  );
}

type ListTab = keyof typeof a.lists;

function OrderLists({ orders }: { orders: OrderListItem[] }) {
  const [list, setList] = useState<ListTab>("active");
  const groups: Record<ListTab, OrderListItem[]> = {
    active: orders.filter((o) => isActiveOrder(o.status)),
    completed: orders.filter((o) => o.status === "delivered"),
    cancelled: orders.filter((o) => o.status === "cancelled"),
  };
  const keys = Object.keys(a.lists) as ListTab[];
  const shown = groups[list];

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label={a.tabs.orders} className="flex gap-7 overflow-x-auto border-b border-border [scrollbar-width:none]">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`list-${k}`}
            aria-selected={list === k}
            aria-controls="list-panel"
            onClick={() => setList(k)}
            className={cn(
              "-mb-px border-b-2 px-1 pb-2.5 text-xs whitespace-nowrap transition-colors focus-ring",
              list === k ? "border-accent font-semibold text-accent" : "border-transparent text-muted hover:text-primary",
            )}
          >
            {a.withCount(a.lists[k], groups[k].length)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="list-panel" aria-labelledby={`list-${list}`}>
        {shown.length ? (
          <ul className="flex flex-col gap-3">
            {shown.map((o) => (
              <li key={o.id}>
                <OrderRow order={o} />
              </li>
            ))}
          </ul>
        ) : list === "active" ? (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{a.noActive}</p>
            <ButtonLink href={routes.book} size="sm">
              {strings.track.bookCta}
            </ButtonLink>
          </Card>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function MeasurementsPromo({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-blush-wash shadow-card">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
        <Photo image={media.tape} className="absolute inset-0" sizes="(min-width: 768px) 30vw, 50vw" />
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-blush to-transparent" />
      </div>
      <div className="relative flex max-w-xs flex-col items-start gap-1 p-5 md:p-6">
        <h2 className="text-2xl leading-tight text-accent">{a.promoTitle}</h2>
        <p className="mb-3 text-xs text-muted">{a.promoBody}</p>
        <Button variant="dark" size="sm" onClick={onClick} rightIcon={<ArrowRight size={14} aria-hidden />}>
          {a.promoCta}
        </Button>
      </div>
    </div>
  );
}

function MeasurementsTab() {
  const { data, status, reload } = useApi("my-measurements", customerApi.measurements);
  return (
    <DataState
      status={status}
      data={data}
      onRetry={reload}
      empty={<EmptyState icon={Ruler} title={a.noMeasurementsTitle} body={a.noMeasurementsBody} />}
    >
      {(items) => (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((m) => (
            <Card key={m.orderId}>
              <h3 className="text-base font-semibold">{m.serviceName}</h3>
              <p className="mb-3 text-xs text-muted">
                {a.fromOrder(m.orderId, formatDate(m.createdAt))}
              </p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {m.values.map((v) => (
                  <div key={v.key} className="flex justify-between gap-2 rounded-control bg-surface-muted px-2.5 py-1.5">
                    <dt className="truncate text-xs text-muted">{v.label}</dt>
                    <dd className="text-xs font-medium whitespace-nowrap text-text">
                      {v.value} {m.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </DataState>
  );
}

function ProfileTab({ session }: { session: Session }) {
  const toast = useToast();
  const [values, setValues] = useState({
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    address: session.user.address ?? "",
    city: session.user.city ?? "",
    postalCode: session.user.postalCode ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = compact({
      name: values.name.trim().length < 2 ? strings.validation.required(strings.fields.name) : undefined,
      email: values.email && !isEmail(values.email) ? strings.validation.email : undefined,
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const user: User = await authApi.updateProfile({
        name: values.name.trim(),
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        city: values.city.trim() || null,
        postalCode: values.postalCode.trim() || null,
      });
      sessions.customer.set({ ...session, user });
      toast.success(a.profileSaved);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
        <Input label={strings.fields.name} value={values.name} onChange={set("name")} error={errors.name} />
        <Input label={strings.fields.phone} value={session.user.phone ?? ""} disabled />
        <Input
          label={strings.fields.email}
          type="email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          containerClassName="md:col-span-2"
        />
        <Textarea
          label={strings.fields.address}
          rows={3}
          value={values.address}
          onChange={set("address")}
          containerClassName="md:col-span-2"
        />
        <Input label={strings.fields.city} value={values.city} onChange={set("city")} />
        <Input label={strings.fields.pincode} value={values.postalCode} onChange={set("postalCode")} />
        <div className="md:col-span-2">
          <Button type="submit" loading={saving}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}

const navItem =
  "inline-flex h-9 shrink-0 items-center gap-3 rounded-control px-3 text-sm whitespace-nowrap transition-colors focus-ring";
const navIdle = "text-text hover:bg-accent-soft hover:text-accent";

function Dashboard({ session }: { session: Session }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const name = session.user.name?.trim();

  const tabButton = (key: Tab, Icon: LucideIcon) => (
    <button
      type="button"
      aria-current={tab === key ? "page" : undefined}
      aria-controls="account-panel"
      onClick={() => setTab(key)}
      className={cn(navItem, tab === key ? "bg-accent font-medium text-on-accent" : navIdle)}
    >
      <Icon size={16} aria-hidden />
      {a.tabs[key]}
    </button>
  );
  const linkItem = (href: string, label: string, Icon: LucideIcon) => (
    <Link href={href} className={cn(navItem, navIdle)}>
      <Icon size={16} aria-hidden />
      {label}
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-5 border-b border-border bg-surface px-4 py-5 md:w-60 md:border-r md:border-b-0 md:py-7">
        <div className="flex items-center gap-3 px-1">
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong"
          >
            {name ? name.charAt(0).toUpperCase() : <UserRound size={18} />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{name || a.greeting("")}</p>
            <p className="truncate text-xs text-muted">{session.user.email ?? session.user.phone}</p>
          </div>
        </div>
        <nav aria-label={a.title} className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col">
          {tabButton("orders", ShoppingBag)}
          {linkItem(routes.book, a.nav.book, CirclePlus)}
          {tabButton("measurements", Ruler)}
          {tabButton("profile", UserRound)}
          <span aria-hidden className="hidden h-3 md:block" />
          {linkItem(routes.contact, a.nav.help, LifeBuoy)}
        </nav>
        <button
          type="button"
          onClick={() => {
            sessions.customer.set(null);
            router.replace(routes.home);
          }}
          className={cn(navItem, "w-fit font-medium text-accent hover:bg-accent-soft md:mt-auto")}
        >
          <LogOut size={16} aria-hidden />
          {a.nav.logout}
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-7 md:px-8">
        <div className="flex w-full max-w-4xl flex-col gap-5">
          <h1 className="text-3xl">{a.tabs[tab]}</h1>
          <div id="account-panel">
            {tab === "orders" && <OrdersTab onMeasurements={() => setTab("measurements")} />}
            {tab === "measurements" && <MeasurementsTab />}
            {tab === "profile" && <ProfileTab session={session} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AccountDashboard() {
  return (
    <RequireSession role="customer" loginHref={routes.loginNext}>
      {(session) => <Dashboard session={session} />}
    </RequireSession>
  );
}
