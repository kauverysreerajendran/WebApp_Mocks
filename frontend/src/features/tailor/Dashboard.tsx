"use client";

import { ArrowDown, ArrowRight, ArrowUp, CircleCheckBig, ClipboardList, Inbox, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ErrorState, Photo, Skeleton } from "@/components/ui";
import { serviceMedia } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderListItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { displayName, useTailor } from "./TailorContext";
import { PortalBanner, STAGE_OF, StageBadge, TodayChip, dueDateOf, panel, td, th, type Stage } from "./portal";

const t = strings.tailor;
const p = strings.tailorPortal;
const DAY_MS = 86_400_000;

type Tone = "rose" | "blue" | "green" | "amber";

/** Card wash, icon tile and trend-line colour per stat (one hue each, as in the reference). */
const TONE: Record<Tone, { card: string; tile: string; up: string; line: string }> = {
  rose: { card: "from-accent-soft/80", tile: "bg-accent-soft text-accent", up: "text-accent", line: "#d0638a" },
  blue: { card: "from-info-soft/80", tile: "bg-info-soft text-info", up: "text-success", line: "#5b93dd" },
  green: { card: "from-success-soft/80", tile: "bg-success-soft text-success", up: "text-success", line: "#62b98a" },
  amber: { card: "from-warning-soft/80", tile: "bg-warning-soft text-warning-strong", up: "text-success", line: "#e8b04a" },
};

interface Trend {
  /** Seven daily values, oldest first. */
  days: number[];
  /** Change this week vs the 7 days before, in %. */
  change: number;
}

/** Daily totals for the last 14 days → this week's sparkline and the change vs last week. */
function trendOf(orders: OrderListItem[], pick: (o: OrderListItem) => { at: string; value: number } | null): Trend {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 13 * DAY_MS;
  const daily = Array<number>(14).fill(0);
  orders.forEach((o) => {
    const hit = pick(o);
    if (!hit) return;
    const i = Math.floor((new Date(hit.at).getTime() - start) / DAY_MS);
    if (i >= 0 && i < 14) daily[i] += hit.value;
  });
  const prev = daily.slice(0, 7).reduce((s, n) => s + n, 0);
  const cur = daily.slice(7).reduce((s, n) => s + n, 0);
  const change = prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0;
  return { days: daily.slice(7), change };
}

/** Smooth area sparkline (decorative; the number beside it carries the value). */
function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  const w = 72;
  const h = 30;
  // Cumulative, so the line climbs with the week's activity instead of spiking to zero between days.
  const cum = values.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);
  const max = Math.max(1, ...cum);
  const pts = cum.map((v, i) => [(i / (cum.length - 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const mx = (px + x) / 2;
    return `${d} C${mx},${py} ${mx},${y} ${x},${y}`;
  }, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute right-3 bottom-3 h-8 w-[76px]" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, icon: Icon, tone, href, trend }: { label: string; value: string | number; icon: LucideIcon; tone: Tone; href: string; trend?: Trend }) {
  const c = TONE[tone];
  const change = trend?.change ?? 0;
  const Arrow = change < 0 ? ArrowDown : ArrowUp;
  return (
    <Link
      href={href}
      className={cn(panel, "relative flex items-start gap-3 bg-linear-to-br to-surface to-60% p-3.5 transition-shadow hover:shadow-lift focus-ring", c.card)}
    >
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-card", c.tile)}>
        <Icon size={19} strokeWidth={1.6} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-text">{label}</span>
        <span className="text-xl leading-tight font-semibold text-primary">{value}</span>
        {trend && (
          <span className="mt-0.5 flex flex-col text-[0.6875rem] leading-tight">
            <span className={cn("inline-flex items-center gap-0.5 font-medium", change > 0 ? c.up : change < 0 ? "text-error" : "text-muted")}>
              <Arrow size={11} strokeWidth={2.2} aria-hidden />
              {change > 0 ? "+" : ""}
              {change}%
            </span>
            <span className="text-muted">{p.vsLastWeek}</span>
          </span>
        )}
      </span>
      {trend && <Sparkline values={trend.days} color={c.line} id={`spark-${tone}`} />}
    </Link>
  );
}

/** Service photo for an order thumbnail (service name → catalogue slug, else the closest match). */
function thumbOf(serviceName: string) {
  const slug = serviceName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const image =
    serviceMedia[slug] ?? Object.entries(serviceMedia).find(([key]) => slug.startsWith(key.split("-")[0]))?.[1] ?? serviceMedia["blouse-stitching"];
  return { ...image, alt: "" };
}

const inStages = (stages: Stage[]) => (o: OrderListItem) => (stages.includes(STAGE_OF[o.status]) ? { at: o.createdAt, value: 1 } : null);

/** Tailor Home Dashboard (reference screen 1 / brief "Today's Summary"). */
export function Dashboard() {
  const { profile } = useTailor();
  const router = useRouter();
  const { data, status, reload } = useApi("tailor-dashboard", tailorApi.dashboard);
  const orders = useApi("tailor-orders:all", () => tailorApi.orders("all")).data;

  const trends = useMemo(() => {
    if (!orders) return null;
    return {
      new: trendOf(orders, inStages(["new"])),
      active: trendOf(orders, inStages(["accepted", "inProgress", "ready"])),
      completed: trendOf(orders, (o) => (o.status === "delivered" ? { at: o.updatedAt, value: 1 } : null)),
      earnings: trendOf(orders, (o) => (o.status === "delivered" ? { at: o.updatedAt, value: o.total } : null)),
    };
  }, [orders]);

  return (
    <div className="flex flex-col gap-4">
      <PortalBanner />

      <div className="flex flex-wrap items-start justify-between gap-3 pt-2 sm:pt-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[1.75rem]">
            {t.welcome(displayName(profile))} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-0.5 text-sm text-text">{p.overview}</p>
        </div>
        <TodayChip className="sm:-mt-3" />
      </div>

      {profile.status !== "approved" && (
        <div
          role="status"
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-card border px-4 py-2.5 text-sm",
            profile.status === "rejected" ? "border-error/30 bg-error-soft text-error" : "border-warning/30 bg-warning-soft text-warning-strong",
          )}
        >
          <span>
            <strong>{profile.status === "rejected" ? t.rejectedTitle : p.verificationPending}</strong>{" "}
            {profile.status === "rejected" ? (profile.rejectionReason ?? t.rejectedBody) : p.verificationPendingBody}
          </span>
          <Link href={profile.status === "rejected" ? routes.tailor.onboarding : routes.tailor.status} className="font-medium underline underline-offset-2 focus-ring">
            {profile.status === "rejected" ? t.editAndResubmit : p.viewStatus}
          </Link>
        </div>
      )}

      <section aria-label={t.todaySummary} className="mt-2">
        {status === "error" ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data ? (
              <>
                <Stat label={p.stats.newOrders} value={data.newOrders} icon={Inbox} tone="rose" trend={trends?.new} href={`${routes.tailor.orders}?tab=new`} />
                <Stat label={p.stats.activeOrders} value={data.activeOrders} icon={ClipboardList} tone="blue" trend={trends?.active} href={`${routes.tailor.orders}?tab=inProgress`} />
                <Stat label={p.stats.completedOrders} value={data.completedOrders} icon={CircleCheckBig} tone="green" trend={trends?.completed} href={routes.tailor.completed} />
                <Stat label={p.stats.earnings} value={formatMoney(data.earnings, data.currency)} icon={Wallet} tone="amber" trend={trends?.earnings} href={routes.tailor.wallet} />
              </>
            ) : (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-card" />)
            )}
          </div>
        )}
      </section>

      <DashboardAnalytics />

      <section aria-labelledby="recent-title" className={panel}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 id="recent-title" className="text-base font-semibold">
            {t.recentOrders}
          </h2>
          <Link href={routes.tailor.orders} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
            {p.viewAll} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        {!data ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : data.recentOrders.length === 0 ? (
          <p className="p-4 text-sm text-muted">{t.noRecent}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">{t.recentOrders}</caption>
              <thead className="bg-accent-soft/50">
                <tr>
                  <th scope="col" className={th}>{p.cols.no}</th>
                  <th scope="col" className={cn(th, "w-12")}>
                    <span className="sr-only">{p.cols.service}</span>
                  </th>
                  <th scope="col" className={th}>{p.cols.customer}</th>
                  <th scope="col" className={th}>{p.cols.service}</th>
                  <th scope="col" className={th}>{p.cols.amount}</th>
                  <th scope="col" className={cn(th, "hidden md:table-cell")}>{p.cols.dueDate}</th>
                  <th scope="col" className={th}>{p.cols.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentOrders.map((o) => (
                  <tr key={o.id} onClick={() => router.push(routes.tailor.order(o.id))} className="cursor-pointer hover:bg-surface-muted">
                    <td className={cn(td, "font-medium text-primary")}>
                      <Link href={routes.tailor.order(o.id)} className="rounded-control focus-ring" onClick={(e) => e.stopPropagation()}>
                        {strings.common.orderNo(o.id)}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-1 pl-3">
                      <Photo image={thumbOf(o.serviceName)} className="size-8 rounded-control" sizes="32px" />
                    </td>
                    <td className={td}>{o.customerName}</td>
                    <td className={td}>{o.serviceName}</td>
                    <td className={td}>{formatMoney(o.total, o.currency)}</td>
                    <td className={cn(td, "hidden text-muted md:table-cell")}>{formatDate(dueDateOf(o))}</td>
                    <td className={td}>
                      <StageBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
