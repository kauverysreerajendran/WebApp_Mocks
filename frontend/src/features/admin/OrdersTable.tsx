"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useState, type ReactNode } from "react";
import { EmptyState, Select, Table, type Column } from "@/components/ui";
import { strings } from "@/i18n";
import { adminApi, type AdminOrderFilters } from "@/lib/api/endpoints";
import type { OrderListItem, OrderStatus } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { ALL_ORDER_STATUSES } from "@/lib/status";
import { OrderStatusBadge, formatVisit } from "@/features/orders/OrderParts";
import { AdminOrderDrawer } from "./AdminOrderDrawer";

const c = strings.admin.cols;

export const baseColumns: Column<OrderListItem>[] = [
  { key: "id", header: c.order, cell: (o) => <span className="font-semibold text-primary">{strings.common.orderNo(o.id)}</span> },
  {
    key: "customer",
    header: c.customer,
    cell: (o) => (
      <span className="flex flex-col">
        <span className="font-medium">{o.customerName}</span>
        <span className="text-xs text-muted">{o.city}</span>
      </span>
    ),
  },
  {
    key: "service",
    header: c.service,
    hideBelow: "md",
    cell: (o) => (
      <span className="flex flex-col">
        <span>{o.serviceName}</span>
        <span className="text-xs text-muted">{o.packageName}</span>
      </span>
    ),
  },
  { key: "tailor", header: c.tailor, hideBelow: "lg", cell: (o) => o.tailor?.name ?? <span className="text-muted">{strings.admin.unassigned}</span> },
  { key: "status", header: c.status, cell: (o) => <OrderStatusBadge status={o.status} /> },
  { key: "amount", header: c.amount, align: "right", cell: (o) => formatMoney(o.total, o.currency) },
  { key: "date", header: c.date, hideBelow: "lg", cell: (o) => formatDate(o.createdAt) },
];

export const visitColumn: Column<OrderListItem> = {
  key: "visit",
  header: c.visit,
  hideBelow: "md",
  cell: (o) => (o.measurementMethod === "visit" ? formatVisit(o.visitDate, o.visitSlot) : <span className="text-muted">{strings.measurement.self}</span>),
};

interface OrdersTableProps {
  /** Fixed server-side filters for this screen. */
  filters?: AdminOrderFilters;
  columns?: Column<OrderListItem>[];
  /** Extra trailing column, e.g. an Assign button. */
  action?: (order: OrderListItem, reload: () => void) => ReactNode;
  showStatusFilter?: boolean;
  empty?: { title: string; body: string };
  /** Bump to force a reload from outside. */
  refreshKey?: number;
}

/** Searchable, filterable order table with the detail drawer (C2). */
export function OrdersTable({
  filters = {},
  columns = baseColumns,
  action,
  showStatusFilter = true,
  empty = { title: strings.admin.noOrdersTitle, body: strings.admin.noOrdersBody },
  refreshKey = 0,
}: OrdersTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [openId, setOpenId] = useState<number | null>(null);
  const q = useDeferredValue(query.trim());
  const params = { ...filters, q, status: status || filters.status };
  const { data, status: loadStatus, reload } = useApi(`admin-orders:${JSON.stringify(params)}:${refreshKey}`, () =>
    adminApi.orders(params),
  );

  const allColumns: Column<OrderListItem>[] = action
    ? [...columns, { key: "action", header: c.action, align: "right", cell: (o) => <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{action(o, reload)}</span> }]
    : columns;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="relative flex-1">
          <span className="sr-only">{strings.common.search}</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.admin.searchPlaceholder}
            className="h-10 w-full rounded-control border border-border-strong bg-surface pr-3 pl-9 text-sm focus-ring hover:border-accent"
          />
        </label>
        {showStatusFilter && (
          <Select
            label={strings.admin.statusFilter}
            hideLabel
            containerClassName="md:w-60"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
            options={[
              { value: "", label: strings.admin.allStatuses },
              ...ALL_ORDER_STATUSES.map((s) => ({ value: s, label: strings.status.order[s] })),
            ]}
          />
        )}
      </div>
      <Table
        caption={strings.admin.ordersTitle}
        columns={allColumns}
        rows={data}
        rowKey={(o) => String(o.id)}
        status={loadStatus}
        onRetry={reload}
        onRowClick={(o) => setOpenId(o.id)}
        empty={<EmptyState title={empty.title} body={empty.body} />}
      />
      <AdminOrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
