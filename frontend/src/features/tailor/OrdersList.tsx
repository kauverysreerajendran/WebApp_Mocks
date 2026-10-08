"use client";

import { Ban, CircleCheckBig, ClipboardList, Filter, Inbox, ListChecks } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ButtonLink, EmptyState, ErrorState, Modal, Skeleton, Textarea, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderListItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { OrderThumb } from "@/features/orders/OrderParts";
import { ORDER_TABS, PAGE_SIZE, Pager, SearchBox, StageBadge, matchesQuery, panel, tabOf, td, th, type OrderTab } from "./portal";

const t = strings.tailor;
const p = strings.tailorPortal;

const EMPTY: Record<OrderTab, { icon: typeof Inbox; title: string; body: string }> = {
  new: { icon: Inbox, title: t.noNewTitle, body: t.noNewBody },
  accepted: { icon: ListChecks, title: t.noActiveTitle, body: t.noActiveBody },
  inProgress: { icon: ClipboardList, title: t.noActiveTitle, body: t.noActiveBody },
  completed: { icon: CircleCheckBig, title: t.noCompletedTitle, body: t.noCompletedBody },
  cancelled: { icon: Ban, title: p.noMatches, body: "" },
};

/** Accept / Decline controls for a newly assigned order (B7). */
export function useOrderDecision(onDone: (accepted: boolean, orderId: number) => void) {
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const [declining, setDeclining] = useState<OrderListItem | null>(null);
  const [reason, setReason] = useState("");

  const accept = async (order: OrderListItem) => {
    setBusy(order.id);
    try {
      await tailorApi.accept(order.id);
      onDone(true, order.id);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const confirmDecline = async () => {
    if (!declining) return;
    setBusy(declining.id);
    try {
      await tailorApi.decline(declining.id, reason.trim() || undefined);
      onDone(false, declining.id);
      setDeclining(null);
      setReason("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  /** Single compact Accept button for table rows. */
  const acceptButton = (order: OrderListItem) => (
    <Button size="sm" onClick={() => accept(order)} loading={busy === order.id && !declining} disabled={busy !== null}>
      {t.accept}
    </Button>
  );

  const actions = (order: OrderListItem) => (
    <>
      <Button className="flex-1" onClick={() => accept(order)} loading={busy === order.id && !declining} disabled={busy !== null}>
        {t.accept}
      </Button>
      <Button variant="secondary" className="flex-1" onClick={() => setDeclining(order)} disabled={busy !== null}>
        {t.decline}
      </Button>
    </>
  );

  const dialog = (
    <Modal
      open={declining !== null}
      onClose={() => setDeclining(null)}
      title={t.declineTitle}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => setDeclining(null)}>
            {strings.common.cancel}
          </Button>
          <Button variant="danger" onClick={confirmDecline} loading={busy !== null}>
            {t.declineConfirm}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">{t.declineBody}</p>
      <Textarea label={t.declineReason} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );

  return { actions, acceptButton, dialog };
}

/** Completed lives on its own route (/tailor/completed); the other tabs are ?tab= on /tailor/orders. */
function tabHref(tab: OrderTab) {
  return tab === "completed" ? routes.tailor.completed : `${routes.tailor.orders}?tab=${tab}`;
}

const fromIso = (s: string) => new Date(`${s}T00:00:00`);
const DAY_MS = 86_400_000;
const control = "h-9 rounded-control border border-border bg-surface text-sm text-text hover:border-border-strong focus:border-accent focus:outline-none";

/**
 * Orders board (reference screens 2 & 5): status tabs with counts, search, service filter,
 * compact table and pagination. The Completed tab adds a date range and a Completed Date column.
 */
export function OrdersBoard({ fixedTab }: { fixedTab?: OrderTab }) {
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get("tab") as OrderTab | null;
  const searched = params.get("q") ?? "";
  const { data, status, reload } = useApi("tailor-orders:all", () => tailorApi.orders("all"));
  // A search from the top bar (?q=) without a tab opens the first tab that has a match.
  const matchTab = searched && data ? (ORDER_TABS.find((tb) => data.some((o) => tabOf(o.status) === tb && matchesQuery(o, searched))) ?? "new") : "new";
  const tab: OrderTab = fixedTab ?? (requested && ORDER_TABS.includes(requested) ? requested : matchTab);
  const decision = useOrderDecision((accepted, id) => (accepted ? router.push(routes.tailor.order(id)) : reload()));
  const [query, setQuery] = useState(searched);
  const [lastSearched, setLastSearched] = useState(searched);
  if (searched !== lastSearched) {
    setLastSearched(searched);
    setQuery(searched);
  }
  const [service, setService] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const completed = tab === "completed";

  const counts = useMemo(() => {
    const c: Record<OrderTab, number> = { new: 0, accepted: 0, inProgress: 0, completed: 0, cancelled: 0 };
    data?.forEach((o) => c[tabOf(o.status)]++);
    return c;
  }, [data]);
  const services = useMemo(() => [...new Set(data?.map((o) => o.serviceName))].sort(), [data]);

  const rows = useMemo(() => {
    const list = (data ?? []).filter((o) => {
      if (tabOf(o.status) !== tab || !matchesQuery(o, query)) return false;
      if (service && o.serviceName !== service) return false;
      if (completed) {
        const done = new Date(o.updatedAt).getTime();
        if (from && done < fromIso(from).getTime()) return false;
        if (to && done >= fromIso(to).getTime() + DAY_MS) return false;
      }
      return true;
    });
    const key = (o: OrderListItem) => new Date(completed ? o.updatedAt : o.createdAt).getTime();
    return list.sort((a, b) => key(b) - key(a));
  }, [data, tab, query, service, from, to, completed]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = Boolean(query || service || from || to);
  const empty = EMPTY[tab];
  const showStatus = !completed && tab !== "new";

  const update = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };
  const clear = () => {
    setQuery("");
    setService("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">{p.ordersHeading[tab]}</h1>

      <nav aria-label={t.ordersTitle} className="flex gap-5 overflow-x-auto border-b border-border">
        {ORDER_TABS.map((key) => (
          <Link
            key={key}
            href={tabHref(key)}
            scroll={false}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-2 text-sm whitespace-nowrap transition-colors focus-ring",
              tab === key ? "border-accent font-medium text-accent" : "border-transparent text-muted hover:text-text",
            )}
          >
            {p.stages[key]}
            {data && counts[key] > 0 ? ` (${counts[key]})` : ""}
          </Link>
        ))}
      </nav>

      <div className={panel}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <SearchBox value={query} onChange={update(setQuery)} className="min-w-52 flex-1" />
          <label className="relative">
            <span className="sr-only">{p.filter}</span>
            <Filter size={14} aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
            <select value={service} onChange={(e) => update(setService)(e.target.value)} className={cn(control, "appearance-none pr-3 pl-8")}>
              <option value="">{p.filter}</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {completed && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="date"
                aria-label={p.from}
                value={from}
                max={to || undefined}
                onChange={(e) => update(setFrom)(e.target.value)}
                className={cn(control, "px-2")}
              />
              –
              <input
                type="date"
                aria-label={p.to}
                value={to}
                min={from || undefined}
                onChange={(e) => update(setTo)(e.target.value)}
                className={cn(control, "px-2")}
              />
            </span>
          )}
          {filtered && (
            <Button variant="text" size="sm" onClick={clear}>
              {p.clear}
            </Button>
          )}
        </div>

        {status === "error" ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            {filtered ? <p className="text-sm text-muted">{p.noMatches}</p> : <EmptyState icon={empty.icon} title={empty.title} body={empty.body} />}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">{p.ordersHeading[tab]}</caption>
                <thead className="bg-surface-muted">
                  <tr>
                    <th scope="col" className={th}>{p.cols.order}</th>
                    <th scope="col" className={th}>{p.cols.customer}</th>
                    <th scope="col" className={th}>{p.cols.service}</th>
                    <th scope="col" className={th}>{completed ? p.cols.amount : p.cols.price}</th>
                    <th scope="col" className={cn(th, "hidden md:table-cell")}>{completed ? p.cols.completedDate : p.cols.orderDate}</th>
                    {showStatus && <th scope="col" className={cn(th, "hidden sm:table-cell")}>{p.cols.status}</th>}
                    <th scope="col" className={cn(th, "text-right")}>{p.cols.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-muted/60">
                      <td className={cn(td, "font-medium text-primary")}>{strings.common.orderNo(o.id)}</td>
                      <td className={td}>
                        <span className="flex items-center gap-2.5">
                          <OrderThumb alt={o.serviceName} className="size-9" />
                          <span className="font-medium text-text">{o.customerName}</span>
                        </span>
                      </td>
                      <td className={td}>{o.serviceName}</td>
                      <td className={td}>{formatMoney(o.total, o.currency)}</td>
                      <td className={cn(td, "hidden text-muted md:table-cell")}>{formatDate(completed ? o.updatedAt : o.createdAt)}</td>
                      {showStatus && (
                        <td className={cn(td, "hidden sm:table-cell")}>
                          <StageBadge status={o.status} />
                        </td>
                      )}
                      <td className={cn(td, "text-right")}>
                        <span className="inline-flex items-center gap-1.5">
                          <ButtonLink href={routes.tailor.order(o.id)} variant="secondary" size="sm">
                            {p.view}
                          </ButtonLink>
                          {tab === "new" && o.status === "assigned" && decision.acceptButton(o)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={current} total={rows.length} onPage={setPage} />
          </>
        )}
      </div>
      {decision.dialog}
    </div>
  );
}

/** /tailor/orders — tab from ?tab= (default New). */
export function OrdersList() {
  return <OrdersBoard />;
}
