"use client";

import { CalendarCheck2, ChevronLeft, ChevronRight, Clock, Coffee, Copy, Info, Pencil, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Button, Modal, Skeleton, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderListItem, Weekday } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatClock, formatDate } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { AvailabilityForm, WEEKDAYS } from "./AvailabilityForm";
import { useTailor } from "./TailorContext";
import { PortalBanner, TodayChip, panel } from "./portal";

const p = strings.tailorPortal;
const c = p.calendar;

/** JS getDay() order (Sunday first), matching the calendar's columns. */
const SUN_FIRST: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Local YYYY-MM-DD (visit dates are stored as plain dates). */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hoursBetween = (from: string, to: string) => Math.round(((minutesOf(to) - minutesOf(from)) / 60) * 10) / 10;
const range = (from: string, to: string) => `${formatClock(from)} – ${formatClock(to)}`;

/** "Mon – Sun" for a run of consecutive days, else "Mon, Wed, Fri". */
function dayRangeLabel(days: Weekday[]): string {
  const idx = WEEKDAYS.map((d, i) => (days.includes(d) ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return strings.common.na;
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (consecutive && idx.length > 2) return `${strings.weekdays[WEEKDAYS[idx[0]]]} – ${strings.weekdays[WEEKDAYS[idx.at(-1)!]]}`;
  return idx.map((i) => strings.weekdays[WEEKDAYS[i]]).join(", ");
}

/** Plain white section: title row + content, generous padding, no inner boxes. */
function Section({ title, action, children, flush }: { title: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className={cn(panel, "flex flex-col gap-5", flush ? "pt-5 pb-2 sm:pt-6" : "p-5 sm:p-6")}>
      <div className={cn("flex min-h-8 items-center justify-between gap-3", flush && "px-5 sm:px-6")}>
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Month grid: working days tinted, the selected date filled, a dot under days with bookings. */
function MonthCalendar({
  workingDays,
  bookings,
  selected,
  onSelect,
}: {
  workingDays: Weekday[];
  bookings: Map<string, number>;
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const d = new Date(`${selected}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = isoDay(new Date());
  const cells = useMemo(() => {
    const first = new Date(month);
    first.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return d;
    });
  }, [month]);
  // Drop a trailing week that belongs entirely to the next month.
  const visible = cells[35].getMonth() !== month.getMonth() ? cells.slice(0, 35) : cells;
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const monthLabel = formatDate(month, { month: "long", year: "numeric" });
  const navBtn = "inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-text focus-ring";

  const legend = [
    { label: c.legend.working, dot: "size-2.5 rounded-[3px] bg-accent-soft ring-1 ring-accent/20" },
    { label: c.legend.selected, dot: "size-2.5 rounded-full bg-accent" },
    { label: c.legend.bookings, dot: "size-1.5 rounded-full bg-accent" },
    { label: c.legend.off, dot: "size-2.5 rounded-[3px] ring-1 ring-border-strong" },
  ];

  return (
    <Section
      title={<span aria-live="polite">{monthLabel}</span>}
      action={
        <div className="flex items-center gap-1">
          <button type="button" className={navBtn} onClick={() => shift(-1)} aria-label={c.prevMonth}>
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="h-8 rounded-full px-3 text-sm font-medium text-accent hover:bg-accent-soft focus-ring"
            onClick={() => {
              const now = new Date();
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              onSelect(today);
            }}
          >
            {c.today}
          </button>
          <button type="button" className={navBtn} onClick={() => shift(1)} aria-label={c.nextMonth}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      }
    >
      <div role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-y-2 text-center">
        <div role="row" className="contents">
          {SUN_FIRST.map((d) => (
            <span key={d} role="columnheader" className="pb-1 text-xs font-medium text-muted">
              {strings.weekdays[d]}
            </span>
          ))}
        </div>
        {Array.from({ length: visible.length / 7 }, (_, w) => (
          <div role="row" key={w} className="contents">
            {visible.slice(w * 7, w * 7 + 7).map((d) => {
              const iso = isoDay(d);
              const inMonth = d.getMonth() === month.getMonth();
              const working = workingDays.includes(SUN_FIRST[d.getDay()]);
              const count = bookings.get(iso) ?? 0;
              const isSelected = iso === selected;
              return (
                <div role="gridcell" key={iso} className="flex justify-center">
                  {inMonth ? (
                    <button
                      type="button"
                      onClick={() => onSelect(iso)}
                      aria-pressed={isSelected}
                      aria-label={c.dayAria(formatDate(d, { weekday: "long", day: "numeric", month: "long" }), working, count)}
                      className={cn(
                        "relative inline-flex size-10 items-center justify-center text-sm transition-colors focus-ring",
                        isSelected
                          ? "rounded-full bg-accent font-semibold text-on-accent"
                          : working
                            ? "rounded-control bg-accent-soft/70 text-primary hover:bg-accent-soft"
                            : "rounded-control text-muted hover:bg-surface-muted",
                        iso === today && !isSelected && "font-semibold text-accent",
                      )}
                    >
                      {d.getDate()}
                      {count > 0 && <span aria-hidden className={cn("absolute bottom-1.5 size-1 rounded-full", isSelected ? "bg-on-accent" : "bg-accent")} />}
                    </button>
                  ) : (
                    <span aria-hidden className="inline-flex size-10 items-center justify-center text-sm text-muted/40">
                      {d.getDate()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
        {legend.map((l) => (
          <li key={l.label} className="flex items-center gap-2">
            <span aria-hidden className={cn("shrink-0", l.dot)} />
            {l.label}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SummaryRow({ icon: Icon, label, sub, value }: { icon: LucideIcon; label: string; sub: string; value: string }) {
  return (
    <li className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon size={18} strokeWidth={1.7} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-text">{label}</span>
        <span className="text-xs text-muted">{sub}</span>
      </span>
      <span className="text-right text-[0.9375rem] font-semibold text-primary">{value}</span>
    </li>
  );
}

/** B11 — Calendar & Availability: month view, summary, weekly schedule and upcoming visits. */
export function AvailabilityView() {
  const { profile, setProfile } = useTailor();
  const toast = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(() => isoDay(new Date()));
  const [dayFilter, setDayFilter] = useState(false);
  const orders = useApi("tailor-orders:all", () => tailorApi.orders("all")).data;

  const visits = useMemo(
    () =>
      (orders ?? [])
        .filter((o): o is OrderListItem & { visitDate: string } => Boolean(o.visitDate) && o.status !== "cancelled")
        .sort((a, b) => `${a.visitDate} ${a.visitSlot ?? ""}`.localeCompare(`${b.visitDate} ${b.visitSlot ?? ""}`)),
    [orders],
  );
  const perDay = useMemo(() => {
    const m = new Map<string, number>();
    visits.forEach((o) => m.set(o.visitDate, (m.get(o.visitDate) ?? 0) + 1));
    return m;
  }, [visits]);
  const today = isoDay(new Date());
  const todayKey = SUN_FIRST[new Date().getDay()];
  const rows = dayFilter ? visits.filter((o) => o.visitDate === selected) : visits.filter((o) => o.visitDate >= today).slice(0, 5);

  const hasBreak = Boolean(profile.breakStart && profile.breakEnd);
  const breakHours = hasBreak ? hoursBetween(profile.breakStart!, profile.breakEnd!) : 0;
  const workingHours = hoursBetween(profile.openTime, profile.closeTime) - breakHours;

  return (
    <div className="flex flex-col gap-6">
      <PortalBanner />

      <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
        <div>
          <nav aria-label={strings.nav.breadcrumb}>
            <ol className="flex items-center gap-1.5 text-xs text-muted">
              <li>{c.crumbRoot}</li>
              <li aria-hidden>
                <ChevronRight size={12} />
              </li>
              <li aria-current="page">{c.crumbCurrent}</li>
            </ol>
          </nav>
          <h1 className="mt-1.5 text-2xl font-semibold sm:text-[1.75rem]">{c.title}</h1>
          <p className="mt-1 text-sm text-text">{c.lead}</p>
        </div>
        <TodayChip />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <MonthCalendar
          workingDays={profile.workingDays}
          bookings={perDay}
          selected={selected}
          onSelect={(iso) => {
            setSelected(iso);
            setDayFilter(iso !== today || perDay.has(iso));
          }}
        />

        <Section
          title={c.summaryTitle}
          action={
            <Button size="sm" leftIcon={<Pencil size={14} aria-hidden />} onClick={() => setEditing(true)}>
              {c.edit}
            </Button>
          }
        >
          <ul className="flex flex-col divide-y divide-border">
            <SummaryRow icon={CalendarCheck2} label={p.workingDays} sub={dayRangeLabel(profile.workingDays)} value={c.daysCount(profile.workingDays.length)} />
            <SummaryRow icon={Clock} label={p.workingHours} sub={c.hoursCount(workingHours)} value={range(profile.openTime, profile.closeTime)} />
            <SummaryRow
              icon={Coffee}
              label={p.breakTime}
              sub={hasBreak ? c.hoursCount(breakHours) : strings.common.na}
              value={hasBreak ? range(profile.breakStart!, profile.breakEnd!) : c.noBreak}
            />
          </ul>
          <p className="mt-auto flex items-start gap-2 text-xs text-muted">
            <Info size={14} aria-hidden className="mt-px shrink-0 text-info" />
            {p.hoursNote}
          </p>
        </Section>
      </div>

      <Section
        title={c.weekly}
        action={
          <button
            type="button"
            onClick={() => toast.success(c.copied)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-accent hover:bg-accent-soft focus-ring"
          >
            <Copy size={14} aria-hidden />
            {c.copyNextWeek}
          </button>
        }
      >
        <div className="-mx-2 overflow-x-auto px-2">
          <ul className="grid min-w-[720px] grid-cols-7">
            {WEEKDAYS.map((d) => {
              const on = profile.workingDays.includes(d);
              const isToday = d === todayKey;
              return (
                <li key={d} className={cn("flex flex-col gap-2 rounded-card px-3 py-3", isToday && "bg-accent-soft/50")}>
                  <span className={cn("text-xs font-semibold tracking-wide uppercase", isToday ? "text-accent" : "text-muted")}>{strings.weekdays[d]}</span>
                  <span className={cn("flex items-center gap-1.5 text-xs font-medium", on ? "text-success" : "text-muted")}>
                    <span aria-hidden className={cn("size-1.5 rounded-full", on ? "bg-success" : "bg-border-strong")} />
                    {on ? c.working : c.off}
                  </span>
                  {on ? (
                    <>
                      <span className="text-sm font-medium text-primary">{range(profile.openTime, profile.closeTime)}</span>
                      <span className="text-xs leading-snug text-muted">
                        {c.breakShort}
                        <br />
                        {hasBreak ? range(profile.breakStart!, profile.breakEnd!) : c.noBreak}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">{strings.common.na}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section
        title={dayFilter ? c.bookingsOn(formatDate(`${selected}T00:00:00`, { day: "numeric", month: "short" })) : c.upcoming}
        flush
        action={
          <span>
            {dayFilter ? (
              <button type="button" onClick={() => setDayFilter(false)} className="text-sm font-medium text-accent hover:underline focus-ring">
                {c.showUpcoming}
              </button>
            ) : (
              <Link href={routes.tailor.orders} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
                {p.viewAll} <ChevronRight size={14} aria-hidden />
              </Link>
            )}
          </span>
        }
      >
        {!orders ? (
          <div className="flex flex-col gap-3 px-5 pb-4 sm:px-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-muted sm:px-6">{dayFilter ? c.noneOnDay : c.noUpcoming}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{c.upcoming}</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  {[c.cols.date, c.cols.time, c.cols.orderId, c.cols.customer, c.cols.service].map((h) => (
                    <th key={h} scope="col" className="px-3 pb-2 font-medium whitespace-nowrap first:pl-5 sm:first:pl-6">
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="w-10 pr-5 sm:pr-6">
                    <span className="sr-only">{strings.common.view}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-t border-border">
                {rows.map((o) => (
                  <tr key={o.id} onClick={() => router.push(routes.tailor.order(o.id))} className="cursor-pointer hover:bg-surface-muted">
                    <td className="px-3 py-3.5 pl-5 whitespace-nowrap sm:pl-6">{formatDate(`${o.visitDate}T00:00:00`)}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted">{o.visitSlot ? formatClock(o.visitSlot.split("-")[0]) : strings.common.na}</td>
                    <td className="px-3 py-3.5 font-medium whitespace-nowrap text-primary">
                      <Link href={routes.tailor.order(o.id)} className="rounded-control focus-ring" onClick={(e) => e.stopPropagation()}>
                        {strings.common.orderNo(o.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{o.customerName}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{o.serviceName}</td>
                    <td className="py-3.5 pr-5 text-muted sm:pr-6">
                      <ChevronRight size={15} aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Modal open={editing} onClose={() => setEditing(false)} title={c.edit} size="lg">
        <AvailabilityForm
          initial={profile}
          submitLabel={p.saveAvailability}
          onSubmit={async (value) => {
            try {
              setProfile(await tailorApi.saveAvailability(value));
              toast.success(strings.tailor.availabilitySaved);
              setEditing(false);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </Modal>
    </div>
  );
}
