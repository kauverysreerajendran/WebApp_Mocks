import { Check, CircleX } from "lucide-react";
import { strings } from "@/i18n";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { ORDER_FLOW } from "@/lib/status";
import { latestEvents, type TimelineEvent } from "./OrderParts";

/**
 * Horizontal tracker: small stage circles joined by a thin rail, the current stage ringed.
 * `compact` drops the per-stage labels (list cards). The full version labels every stage on
 * desktop (with the date it was reached); phones get a one-line summary instead.
 * `summary={false}` hides the "status · stage x of y" header row on desktop (the caller
 * already shows the status, e.g. as a chip).
 */
export function OrderProgress({
  status,
  events = [],
  compact = false,
  summary = true,
}: {
  status: OrderStatus;
  events?: TimelineEvent[];
  compact?: boolean;
  summary?: boolean;
}) {
  const labels = strings.status.orderCustomer;
  const lastEvent = latestEvents(events);
  const total = ORDER_FLOW.length;
  const cancelled = status === "cancelled";
  // A cancelled order freezes at the last stage it reached.
  const reached = cancelled
    ? Math.max(0, ...events.filter((e) => e.status !== "cancelled").map((e) => ORDER_FLOW.indexOf(e.status)))
    : ORDER_FLOW.indexOf(status);
  const delivered = status === "delivered";
  const pct = (reached / (total - 1)) * 100;

  const header = (
    <div className={cn("flex items-baseline justify-between gap-3", !compact && !summary && "md:hidden")}>
      <p className={cn("font-semibold", cancelled ? "text-error" : "text-primary", compact ? "text-sm" : "text-sm md:text-base")}>
        {labels[status]}
      </p>
      <p className="text-xs whitespace-nowrap text-muted">{strings.track.stepOf(reached + 1, total)}</p>
    </div>
  );

  const progressProps = {
    role: "progressbar",
    "aria-label": strings.track.progress,
    "aria-valuemin": 1,
    "aria-valuemax": total,
    "aria-valuenow": reached + 1,
    "aria-valuetext": labels[status],
  } as const;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {header}
        <div {...progressProps} className="relative">
          <div className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 bg-border-strong" />
          <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2">
            <div
              className={cn("h-px transition-[width] duration-700 ease-out-soft", cancelled ? "bg-error" : "bg-accent")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ol className="relative flex justify-between">
            {ORDER_FLOW.map((stage, i) => {
              const done = i < reached || (delivered && i === reached);
              const current = i === reached && !delivered;
              return (
                <li key={stage} className="flex">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      done && "bg-accent",
                      current && (cancelled ? "bg-error ring-3 ring-error/15" : "bg-accent ring-3 ring-accent/15"),
                      !done && !current && "bg-border-strong",
                    )}
                  >
                    <span className="sr-only">{labels[stage]}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {header}
      <div {...progressProps} className="relative">
        {/* Rail runs between the first and last circle centres (centres of the outer grid columns), at circle-centre height. */}
        <div className="absolute inset-x-[calc(100%/14)] top-3 h-px bg-border-strong" />
        <div className="absolute inset-x-[calc(100%/14)] top-3">
          <div
            className={cn("h-px transition-[width] duration-700 ease-out-soft", cancelled ? "bg-error" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <ol className="relative grid grid-cols-7">
          {ORDER_FLOW.map((stage, i) => {
            const done = i < reached || (delivered && i === reached);
            const current = i === reached && !delivered;
            const event = i <= reached ? lastEvent.get(stage) : undefined;
            return (
              <li key={stage} className="flex flex-col items-center gap-2 px-0.5 text-center">
                <span className="flex h-6 items-center justify-center">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full",
                      current ? "size-6" : "size-5",
                      done && "bg-accent text-on-accent",
                      current &&
                        (cancelled ? "bg-error text-on-accent ring-4 ring-error/15" : "bg-accent text-on-accent ring-4 ring-accent/15"),
                      !done && !current && "border border-border-strong bg-surface-muted",
                    )}
                  >
                    {done && <Check size={11} strokeWidth={3} aria-hidden />}
                    {current && !cancelled && <Check size={13} strokeWidth={3} aria-hidden />}
                    {current && cancelled && <CircleX size={13} aria-hidden />}
                    {!done && !current && <span aria-hidden className="size-1.5 rounded-full bg-border-strong" />}
                    <span className="sr-only">{labels[stage]}</span>
                  </span>
                </span>
                <span aria-hidden className="hidden flex-col gap-0.5 md:flex">
                  <span
                    className={cn(
                      "text-xs leading-tight",
                      current ? (cancelled ? "font-semibold text-error" : "font-semibold text-accent") : done ? "text-text" : "text-muted",
                    )}
                  >
                    {labels[stage]}
                  </span>
                  {event && (
                    <span className="text-xs leading-tight text-muted">
                      {formatDate(event.createdAt, { day: "numeric", month: "short" })}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
