import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-strong",
  error: "bg-error-soft text-error",
  accent: "bg-accent-soft text-accent-strong",
};

const dots: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  accent: "bg-accent",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}

/** Gold price highlight. Dark text on a soft gold chip keeps WCAG AA contrast. */
export function PriceTag({ children, size = "md", className }: { children: ReactNode; size?: "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control bg-accent-soft font-semibold whitespace-nowrap text-accent-strong",
        size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
