"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui";
import { media } from "@/config/media";
import { strings } from "@/i18n";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

const p = strings.tailorPortal;

/** The tailor-facing stages shown in the portal (reference screens), grouping backend statuses. */
export type Stage = "new" | "accepted" | "inProgress" | "ready" | "completed" | "cancelled";

export const STAGE_OF: Record<OrderStatus, Stage> = {
  placed: "new",
  assigned: "new",
  accepted: "accepted",
  measurement_done: "inProgress",
  stitching: "inProgress",
  ready: "ready",
  delivered: "completed",
  cancelled: "cancelled",
};

const STAGE_TONE: Record<Stage, BadgeTone> = {
  new: "accent",
  accepted: "info",
  inProgress: "warning",
  ready: "success",
  completed: "success",
  cancelled: "error",
};

/** Linear timeline used on Order Details and Update Status. */
export const STAGE_FLOW: Stage[] = ["new", "accepted", "inProgress", "ready", "completed"];

/** Orders-page tabs; "In Progress" also covers Ready for Pickup. */
export const ORDER_TABS = ["new", "accepted", "inProgress", "completed", "cancelled"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export function tabOf(status: OrderStatus): OrderTab {
  const stage = STAGE_OF[status];
  return stage === "ready" ? "inProgress" : stage;
}

export function StageBadge({ status }: { status: OrderStatus }) {
  const stage = STAGE_OF[status];
  // Inside "In Progress" show the precise step (Measurement Done / Stitching).
  const label = stage === "inProgress" ? strings.status.order[status] : p.stages[stage];
  return <Badge tone={STAGE_TONE[stage]}>{label}</Badge>;
}

export function SearchBox({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{p.search}</span>
      <Search size={15} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={p.search}
        className="h-9 w-full rounded-control border border-border bg-surface-muted pr-3 pl-9 text-sm placeholder:text-muted hover:border-border-strong focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 focus:outline-none"
      />
    </label>
  );
}

export const PAGE_SIZE = 5;

/** "Showing 1–5 of 12" + numbered pages. */
export function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const btn = "inline-flex size-7 items-center justify-center rounded-control text-xs focus-ring disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted">
      <span>{p.showing(from, to, total)}</span>
      <nav className="flex items-center gap-1" aria-label={p.page(page)}>
        <button type="button" className={cn(btn, "hover:bg-surface-muted")} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={p.prev}>
          <ChevronLeft size={14} aria-hidden />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onPage(num)}
            aria-current={num === page ? "page" : undefined}
            aria-label={p.page(num)}
            className={cn(btn, num === page ? "bg-accent font-semibold text-on-accent" : "text-text hover:bg-surface-muted")}
          >
            {num}
          </button>
        ))}
        <button type="button" className={cn(btn, "hover:bg-surface-muted")} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={p.next}>
          <ChevronRight size={14} aria-hidden />
        </button>
      </nav>
    </div>
  );
}

/** Case-insensitive match on order number, customer and service. */
export function matchesQuery(o: { id: number; customerName: string; serviceName: string }, q: string): boolean {
  const s = q.trim().toLowerCase().replace(/^#/, "");
  if (!s) return true;
  return String(o.id).includes(s) || o.customerName.toLowerCase().includes(s) || o.serviceName.toLowerCase().includes(s);
}

/** Today's date card shown at the top right of portal pages. */
export function TodayChip({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-card border border-white/70 bg-surface/90 px-3 py-2 shadow-card backdrop-blur-sm", className)}>
      <CalendarDays size={20} strokeWidth={1.6} className="text-accent" aria-hidden />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-primary" suppressHydrationWarning>
          {formatDate(new Date(), { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="text-[0.6875rem] text-muted">{p.productiveDay}</span>
      </span>
    </div>
  );
}

/**
 * Full-width floral banner laid behind a page header; on desktop it runs up under the see-through top bar.
 * Positioned against the shell's <main>, so the page root must not be `relative`.
 */
export function PortalBanner({ variant = "hero" }: { variant?: "hero" | "bar" }) {
  if (variant === "bar") {
    // Photo shows only behind the desktop top bar, fading out to the left; the page header stays plain.
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-14 -z-10 hidden h-14 bg-cover bg-[position:right_38%] bg-no-repeat lg:block"
        style={{ backgroundImage: `url(${media.tailorBanner.src})` }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-background from-35% via-background/60 via-55% to-transparent" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[220px] bg-cover bg-[position:70%_center] bg-no-repeat sm:h-[250px] sm:bg-right lg:-top-14 lg:h-[300px] lg:bg-[position:right_85%]"
      style={{ backgroundImage: `url(${media.tailorBanner.src})` }}
    >
      <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent sm:from-background/40" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}

/** Bordered panel used for tables and side boxes in the portal. */
export const panel = "rounded-card bg-surface shadow-card";

/** Compact table cell / header classes shared by the portal tables. */
export const th = "px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted";
export const td = "px-3 py-2.5 text-sm whitespace-nowrap";

const DUE_DAYS = 7;

/** No due date is stored yet: estimate one week after the measurement visit (or the order date). */
export function dueDateOf(o: { visitDate: string | null; createdAt: string }): Date {
  const base = o.visitDate ? new Date(`${o.visitDate}T00:00:00`) : new Date(o.createdAt);
  base.setDate(base.getDate() + DUE_DAYS);
  return base;
}
