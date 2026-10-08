import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-control", className)} />;
}

/** Generic list skeleton — n card-like rows. */
export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{strings.common.loading}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card">
          <Skeleton className="size-10 shrink-0 rounded-control" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

interface MessageStateProps {
  title?: string;
  body?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = strings.states.emptyTitle,
  body = strings.states.emptyBody,
  icon: Icon = Inbox,
  action,
  className,
}: MessageStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong bg-surface px-5 py-8 text-center",
        className,
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon aria-hidden size={18} />
      </span>
      <h3 className="text-base">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = strings.states.errorTitle,
  body = strings.states.errorBody,
  onRetry,
  className,
}: MessageStateProps & { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-error-soft bg-surface px-5 py-8 text-center",
        className,
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-error-soft text-error">
        <CircleAlert aria-hidden size={18} />
      </span>
      <h3 className="text-base">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {strings.common.retry}
        </Button>
      )}
    </div>
  );
}

export type AsyncStatus = "loading" | "error" | "success";

interface DataStateProps<T> {
  status: AsyncStatus;
  data: T[] | undefined;
  onRetry?: () => void;
  loading?: ReactNode;
  empty?: ReactNode;
  children: (data: T[]) => ReactNode;
}

/** Picks the right state for any list screen: skeleton → error → empty → content. */
export function DataState<T>({ status, data, onRetry, loading, empty, children }: DataStateProps<T>) {
  if (status === "loading") return <>{loading ?? <ListSkeleton />}</>;
  if (status === "error") return <ErrorState onRetry={onRetry} />;
  if (!data || data.length === 0) return <>{empty ?? <EmptyState />}</>;
  return <>{children(data)}</>;
}
