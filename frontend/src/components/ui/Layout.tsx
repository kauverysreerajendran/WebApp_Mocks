import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  lead,
  actions,
  backHref,
  backLabel,
  className,
}: {
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-1">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex w-fit items-center gap-1 rounded-control text-sm text-muted hover:text-accent focus-ring"
          >
            <ChevronLeft size={16} aria-hidden />
            {backLabel}
          </Link>
        )}
        <h1 className="text-2xl">{title}</h1>
        {lead && <p className="max-w-2xl text-sm text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  href?: string;
  emphasis?: boolean;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        {Icon && (
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-control",
              emphasis ? "bg-accent text-on-accent" : "bg-accent-soft text-accent",
            )}
          >
            <Icon size={16} aria-hidden />
          </span>
        )}
      </span>
      <span className="text-xl font-semibold text-primary">{value}</span>
    </>
  );
  const cls =
    "flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4 shadow-card";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-lift focus-ring")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Label/value rows for detail panels. */
export function DescriptionList({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-2 md:grid-cols-[minmax(0,9rem)_1fr]", className)}>
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="text-sm text-text">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}
