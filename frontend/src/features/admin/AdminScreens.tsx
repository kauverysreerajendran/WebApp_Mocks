"use client";

import { ArrowRight, Banknote, CircleCheckBig, ClipboardList, Clock, Landmark, ShieldCheck, UserCog, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/endpoints";
import type { OrderListItem, OrderStatus, TailorOption } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { ALL_ORDER_STATUSES, TAILOR_TONE } from "@/lib/status";
import { OrderStatusBadge } from "@/features/orders/OrderParts";
import { OrdersTable, baseColumns, visitColumn } from "./OrdersTable";

const a = strings.admin;

// ---------- Overview (reference: Admin Dashboard) ----------

const panel = "rounded-card border border-border bg-surface shadow-card";
const th = "px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted";
const td = "px-3 py-2.5 text-sm whitespace-nowrap";

function Stat({ label, value, icon: Icon, tint, href }: { label: string; value: string | number; icon: LucideIcon; tint: string; href: string }) {
  return (
    <Link href={href} className={cn(panel, "flex items-center gap-3 p-3.5 transition-shadow hover:shadow-lift focus-ring")}>
      <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-card", tint)}>
        <Icon size={20} strokeWidth={1.6} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs text-muted">{label}</span>
        <span className="text-xl font-semibold text-primary">{value}</span>
      </span>
    </Link>
  );
}

function PanelHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <h2 className="text-base">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
        {a.viewAll} <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Admin Dashboard: four headline stats, recent orders and vendors; open work items surface as chips. */
export function AdminOverview() {
  const stats = useApi("admin-stats", adminApi.stats);
  const orders = useApi("admin-orders:overview", () => adminApi.orders());
  const tailors = useApi("admin-tailors:overview", () => adminApi.tailors());
  const s = a.stats;
  const d = stats.data;
  const completed = orders.data?.filter((o) => o.status === "delivered").length;
  const recent = orders.data?.slice(0, 5);
  const vendors = tailors.data?.slice(0, 5);
  const alerts = d
    ? [
        { show: d.unassignedOrders > 0, href: routes.admin.assignVendor, icon: UserCog, text: `${s.unassigned}: ${d.unassignedOrders}` },
        { show: d.pendingVerifications > 0, href: routes.admin.verification, icon: ShieldCheck, text: `${s.verifications}: ${d.pendingVerifications}` },
        { show: d.pendingSettlements > 0, href: routes.admin.payments, icon: Landmark, text: `${s.pendingSettlements}: ${formatMoney(d.pendingSettlements, d.currency)}` },
      ].filter((x) => x.show)
    : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={a.dashboardTitle} />
      {stats.status === "error" ? (
        <ErrorState onRetry={stats.reload} />
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {d ? (
            <>
              <Stat label={s.totalOrders} value={d.totalOrders} icon={ClipboardList} tint="bg-accent-soft text-accent" href={routes.admin.orders} />
              <Stat label={s.active} value={d.activeOrders} icon={Clock} tint="bg-warning-soft text-warning-strong" href={routes.admin.updateStatus} />
              <Stat label={s.completed} value={completed ?? "—"} icon={CircleCheckBig} tint="bg-success-soft text-success" href={routes.admin.orders} />
              <Stat label={s.totalPayments} value={formatMoney(d.revenue, d.currency)} icon={Banknote} tint="bg-info-soft text-info" href={routes.admin.payments} />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[74px] rounded-card" />)
          )}
        </div>
      )}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {alerts.map(({ href, icon: Icon, text }) => (
            <Link
              key={text}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 font-medium text-warning-strong hover:border-warning focus-ring"
            >
              <Icon size={13} aria-hidden /> {text}
            </Link>
          ))}
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_20rem]">
        <section className={panel} aria-label={a.recentOrders}>
          <PanelHeader title={a.recentOrders} href={routes.admin.orders} />
          {orders.status === "error" ? (
            <ErrorState onRetry={orders.reload} />
          ) : !recent ? (
            <ListSkeleton rows={5} className="p-4" />
          ) : recent.length === 0 ? (
            <p className="p-4 text-sm text-muted">{a.noOrders}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-muted">
                  <tr>
                    <th scope="col" className={th}>{a.cols.order}</th>
                    <th scope="col" className={th}>{a.cols.customer}</th>
                    <th scope="col" className={th}>{a.cols.service}</th>
                    <th scope="col" className={cn(th, "hidden md:table-cell")}>{a.vendor}</th>
                    <th scope="col" className={th}>{a.cols.status}</th>
                    <th scope="col" className={cn(th, "hidden sm:table-cell")}>{a.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-muted/60">
                      <td className={cn(td, "font-medium text-primary")}>{strings.common.orderNo(o.id)}</td>
                      <td className={td}>{o.customerName}</td>
                      <td className={td}>{o.serviceName}</td>
                      <td className={cn(td, "hidden text-muted md:table-cell")}>{o.tailor?.name ?? a.unassignedShort}</td>
                      <td className={td}>
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className={cn(td, "hidden text-muted sm:table-cell")}>{formatDate(o.createdAt, { day: "numeric", month: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={panel} aria-label={a.vendors}>
          <PanelHeader title={a.vendors} href={routes.admin.verification} />
          {tailors.status === "error" ? (
            <ErrorState onRetry={tailors.reload} />
          ) : !vendors ? (
            <ListSkeleton rows={4} className="p-4" />
          ) : (
            <ul className="divide-y divide-border">
              {vendors.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {initials(v.shopName)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-text">{v.shopName}</span>
                    <span className="text-xs text-muted">{a.ordersCount(v.activeOrders + v.completedOrders)}</span>
                  </span>
                  <Badge tone={TAILOR_TONE[v.status]}>{v.status === "approved" ? a.active : strings.status.tailor[v.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------- C2 View Orders ----------

export function AdminOrders() {
  return (
    <>
      <PageHeader title={a.ordersTitle} />
      <OrdersTable columns={[...baseColumns.slice(0, 3), visitColumn, ...baseColumns.slice(3)]} />
    </>
  );
}

// ---------- Assign Vendor ----------

function TailorPicker({ order, onClose, onAssigned }: { order: OrderListItem; onClose: () => void; onAssigned: () => void }) {
  const toast = useToast();
  const { data, status, reload } = useApi(`tailor-options:${order.id}`, () => adminApi.tailorOptions(order.id));
  const [selected, setSelected] = useState<number | null>(order.tailor?.id ?? null);
  const [saving, setSaving] = useState(false);

  const assign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.assignTailor(order.id, selected);
      toast.success(a.assigned);
      onAssigned();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderOption = (t: TailorOption) => (
    <label
      key={t.id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
        selected === t.id ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong",
      )}
    >
      <input type="radio" name="tailor" className="sr-only" checked={selected === t.id} onChange={() => setSelected(t.id)} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary">{t.shopName}</span>
          {t.sameCity && <Badge tone="success">{a.sameCity}</Badge>}
        </span>
        <span className="text-xs text-muted">
          {t.ownerName} · {t.city} · {a.activeLoad(t.activeOrders)}
        </span>
        <span className="text-xs text-muted">
          {t.workingDays.map((d) => strings.weekdays[d]).join(", ")} · {formatClock(t.openTime)}–{formatClock(t.closeTime)}
        </span>
      </span>
      {t.quotedPrice !== null && (
        <span className="text-right text-sm">
          <span className="block text-xs text-muted">{a.cols.rate}</span>
          <span className="font-semibold">{formatMoney(t.quotedPrice)}</span>
        </span>
      )}
    </label>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={a.chooseTailor(order.id)}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button onClick={assign} loading={saving} disabled={!selected}>
            {a.assign}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">
        {order.serviceName} · {order.packageName} · {order.city}
      </p>
      {status === "loading" && <ListSkeleton rows={3} />}
      {status === "error" && <ErrorState onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={a.noTailorsTitle} body={a.noTailorsBody} />}
      {data && data.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">{a.chooseTailor(order.id)}</legend>
          {data.map(renderOption)}
        </fieldset>
      )}
    </Modal>
  );
}

export function AssignVendor() {
  const [order, setOrder] = useState<OrderListItem | null>(null);
  const [refresh, setRefresh] = useState(0);
  return (
    <>
      <PageHeader title={a.assignVendorTitle} lead={a.assignVendorLead} />
      <OrdersTable
        filters={{ unassigned: true }}
        showStatusFilter={false}
        refreshKey={refresh}
        empty={{ title: a.allAssignedTitle, body: a.allAssignedBody }}
        action={(o) => (
          <Button size="sm" variant={o.tailor ? "secondary" : "primary"} onClick={() => setOrder(o)}>
            {o.tailor ? a.reassign : a.assign}
          </Button>
        )}
      />
      {order && (
        <TailorPicker
          order={order}
          onClose={() => setOrder(null)}
          onAssigned={() => {
            setOrder(null);
            setRefresh((n) => n + 1);
          }}
        />
      )}
    </>
  );
}

// ---------- Assign Executive ----------

function ExecutiveSelect({ order, onDone }: { order: OrderListItem; onDone: () => void }) {
  const toast = useToast();
  const { data } = useApi("admin-executives", adminApi.executives);
  const [saving, setSaving] = useState(false);
  const active = (data ?? []).filter((e) => e.isActive);
  return (
    <Select
      label={a.chooseExecutive}
      hideLabel
      containerClassName="w-48 text-left"
      disabled={saving || !data}
      value={order.executive ? String(order.executive.id) : ""}
      onChange={async (e) => {
        if (!e.target.value) return;
        setSaving(true);
        try {
          await adminApi.assignExecutive(order.id, Number(e.target.value));
          toast.success(a.execAssigned);
          onDone();
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setSaving(false);
        }
      }}
      options={[
        { value: "", label: a.unassigned, disabled: true },
        ...active.map((ex) => ({ value: String(ex.id), label: `${ex.name} · ${ex.area}` })),
      ]}
    />
  );
}

export function AssignExecutive() {
  const [visitsOnly, setVisitsOnly] = useState(true);
  return (
    <>
      <PageHeader
        title={a.assignExecTitle}
        lead={a.assignExecLead}
        actions={<Checkbox label={a.visitsOnly} checked={visitsOnly} onChange={(e) => setVisitsOnly(e.target.checked)} />}
      />
      <OrdersTable
        filters={{ openOnly: true, visitsOnly }}
        columns={[baseColumns[0], baseColumns[1], visitColumn, baseColumns[4]]}
        empty={{ title: a.noVisitsTitle, body: a.noVisitsBody }}
        action={(o, reload) => <ExecutiveSelect order={o} onDone={reload} />}
      />
    </>
  );
}

// ---------- Update Status ----------

function StatusDialog({ order, onClose, onDone }: { order: OrderListItem; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [next, setNext] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!next) return;
    setSaving(true);
    try {
      await adminApi.setStatus(order.id, next, note.trim() || undefined);
      toast.success(a.statusUpdated);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${a.updateStatusTitle} · ${strings.common.orderNo(order.id)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button onClick={save} loading={saving} disabled={!next}>
            {a.apply}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {strings.admin.cols.status}: {strings.status.order[order.status]}
        </p>
        <Select
          label={a.newStatus}
          placeholder={a.newStatus}
          value={next}
          onChange={(e) => setNext(e.target.value as OrderStatus)}
          options={ALL_ORDER_STATUSES.filter((s) => s !== order.status).map((s) => ({
            value: s,
            label: strings.status.order[s],
            disabled: s !== "placed" && s !== "cancelled" && !order.tailor,
          }))}
        />
        <Textarea label={a.note} optional rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

export function UpdateStatus() {
  const [order, setOrder] = useState<OrderListItem | null>(null);
  const [refresh, setRefresh] = useState(0);
  return (
    <>
      <PageHeader title={a.updateStatusTitle} lead={a.updateStatusLead} />
      <OrdersTable
        filters={{ openOnly: true }}
        refreshKey={refresh}
        action={(o) => (
          <Button size="sm" variant="secondary" onClick={() => setOrder(o)}>
            {a.apply}
          </Button>
        )}
      />
      {order && (
        <StatusDialog
          order={order}
          onClose={() => setOrder(null)}
          onDone={() => {
            setOrder(null);
            setRefresh((n) => n + 1);
          }}
        />
      )}
    </>
  );
}

