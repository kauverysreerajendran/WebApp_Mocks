import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends ComponentProps<"div"> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddings = { none: "", sm: "p-3", md: "p-4 md:p-5", lg: "p-5 md:p-6" };

export function Card({ padding = "md", interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface shadow-card",
        paddings[padding],
        interactive && "transition-[border-color,box-shadow] duration-300 ease-out-soft hover:border-border-strong hover:shadow-lift",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}
