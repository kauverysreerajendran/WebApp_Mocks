"use client";

import { Banknote, Hourglass, Percent } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderListItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { STAGE_FLOW, STAGE_OF, panel, type Stage } from "./portal";

const p = strings.tailorPortal;
const a = strings.tailorAnalytics;

/** One hue, light → dark, for the ordered stages (sequential, not categorical). Labels carry identity. */
const STAGE_SHADE: Record<Exclude<Stage, "cancelled">, string> = {
  new: "#f0c2cf",
  accepted: "#d77a98",
  inProgress: "#b2446a",
  ready: "#7f1f41",
  completed: "#4a0f25",
};

function Panel({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(panel, "flex flex-col gap-3 p-4", className)} aria-label={title}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[0.9375rem] font-semibold text-primary">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Segmented bar: share of the tailor's orders at each stage, with an acceptance-rate headline. */
function Pipeline({ orders }: { orders: OrderListItem[] }) {
  const live = orders.filter((o) => o.status !== "cancelled");
  const counts = STAGE_FLOW.map((stage) => ({ stage, n: live.filter((o) => STAGE_OF[o.status] === stage).length }));
  const total = live.length;
  const accepted = total - counts[0].n;
  const rate = total ? Math.round((accepted / total) * 100) : 0;

  return (
    <Panel
      title={a.pipelineTitle}
      aside={
        <span className="text-xs text-muted">
          <span className="text-lg font-semibold text-primary">{rate}%</span> {a.accepted}
        </span>
      }
    >
      {total === 0 ? (
        <p className="text-sm text-muted">{a.noData}</p>
      ) : (
        <>
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={a.pipelineAria(counts.map((c) => `${p.stages[c.stage]} ${c.n}`).join(", "))}>
            {counts
              .filter((c) => c.n > 0)
              .map((c) => (
                <span
                  key={c.stage}
                  title={`${p.stages[c.stage]}: ${c.n}`}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(c.n / total) * 100}%`, background: STAGE_SHADE[c.stage as keyof typeof STAGE_SHADE] }}
                />
              ))}
          </div>
          <ul className="grid grid-cols-5 gap-1">
            {counts.map((c) => (
              <li key={c.stage} className="flex flex-col gap-0.5">
                <span className="flex min-h-[1.75rem] items-start gap-1.5 text-[0.6875rem] leading-tight text-muted">
                  <span aria-hidden className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: STAGE_SHADE[c.stage as keyof typeof STAGE_SHADE] }} />
                  <span>{p.stages[c.stage]}</span>
                </span>
                <span className="text-sm font-semibold text-primary">{c.n}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

/** Orders received per day over the last 7 days (bars, one hue, hover for exact values). */
function Last7Days({ orders }: { orders: OrderListItem[] }) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - i));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const n = orders.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= day && t < next;
      }).length;
      return { day, n };
    });
  }, [orders]);
  const max = Math.max(1, ...days.map((d) => d.n));
  const total = days.reduce((s, d) => s + d.n, 0);

  return (
    <Panel title={a.weekTitle} aside={<span className="text-xs text-muted">{a.weekTotal(total)}</span>}>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={a.weekAria(days.map((d) => `${formatDate(d.day, { weekday: "short" })} ${d.n}`).join(", "))}>
        {days.map(({ day, n }) => (
          <div key={day.toISOString()} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full rounded-control bg-primary px-1.5 py-0.5 text-[0.625rem] whitespace-nowrap text-on-primary opacity-0 transition-opacity group-hover:opacity-100">
              {formatDate(day, { weekday: "short", day: "numeric", month: "short" })}: {n}
            </span>
            <span
              className={cn("w-full max-w-9 rounded-t-[4px] transition-colors", n ? "bg-accent/70 group-hover:bg-accent" : "bg-accent-soft")}
              style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "3px" }}
            />
            <span className="text-[0.625rem] text-muted">{formatDate(day, { weekday: "narrow" })}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Orders per service (magnitude per category → bars of one hue, labelled). */
function ByService({ orders }: { orders: OrderListItem[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => map.set(o.serviceName, (map.get(o.serviceName) ?? 0) + 1));
    return [...map.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
  }, [orders]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Panel title={a.serviceTitle}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{a.noData}</p>
      ) : (
        <ul className="flex flex-col gap-3 pt-1">
          {rows.map(([name, n]) => (
            <li key={name} className="grid grid-cols-[7rem_1fr_1.5rem] items-center gap-3 text-xs">
              <span className="truncate text-text">{name}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-accent-soft">
                <span className="block h-full rounded-full bg-accent/75" style={{ width: `${(n / max) * 100}%` }} title={`${name}: ${n}`} />
              </span>
              <span className="text-right font-semibold text-primary">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon size={15} strokeWidth={1.7} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[0.6875rem] text-muted">{label}</span>
        <span className="text-sm font-semibold text-primary">{value}</span>
      </span>
    </div>
  );
}

/** Dashboard analytics: order progress, 7-day trend, service mix and quick KPIs — all compact. */
export function DashboardAnalytics() {
  const orders = useApi("tailor-orders:all", () => tailorApi.orders("all"));
  const wallet = useApi("tailor-wallet", tailorApi.wallet);
  const list = orders.data;

  if (!list) {
    return (
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-card" />
        ))}
      </div>
    );
  }

  const live = list.filter((o) => o.status !== "cancelled");
  const delivered = live.filter((o) => o.status === "delivered").length;
  const avg = live.length ? Math.round(live.reduce((s, o) => s + o.total, 0) / live.length) : 0;
  const currency = list[0]?.currency ?? wallet.data?.currency;

  return (
    <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr]">
      <div className="flex flex-col gap-3">
        <Pipeline orders={list} />
        <section className={cn(panel, "grid grid-cols-3 gap-2 p-3")} aria-label={a.kpis}>
          <Kpi icon={Banknote} label={a.avgOrder} value={formatMoney(avg, currency)} />
          <Kpi icon={Percent} label={a.completion} value={`${live.length ? Math.round((delivered / live.length) * 100) : 0}%`} />
          <Kpi icon={Hourglass} label={a.pendingPayout} value={wallet.data ? formatMoney(wallet.data.availableBalance, wallet.data.currency) : "—"} />
        </section>
      </div>
      <Last7Days orders={list} />
      <ByService orders={list} />
    </div>
  );
}
