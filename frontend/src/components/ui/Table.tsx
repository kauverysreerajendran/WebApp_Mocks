import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton, EmptyState, ErrorState, type AsyncStatus } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Hide on narrow screens. */
  hideBelow?: "md" | "lg";
  className?: string;
}

interface TableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  status?: AsyncStatus;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  skeletonRows?: number;
}

const hide = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  status = "success",
  onRetry,
  onRowClick,
  empty,
  skeletonRows = 5,
}: TableProps<T>) {
  if (status === "error") return <ErrorState onRetry={onRetry} />;
  if (status === "success" && (!rows || rows.length === 0)) return <>{empty ?? <EmptyState />}</>;

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-left text-sm" aria-busy={status === "loading" || undefined}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-4 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase",
                  c.align === "right" && "text-right",
                  c.hideBelow && hide[c.hideBelow],
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {status === "loading"
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3", c.hideBelow && hide[c.hideBelow])}>
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : rows!.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    "border-t border-border transition-colors",
                    onRowClick && "cursor-pointer hover:bg-accent-soft focus-ring",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 align-middle text-text",
                        c.align === "right" && "text-right",
                        c.hideBelow && hide[c.hideBelow],
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
