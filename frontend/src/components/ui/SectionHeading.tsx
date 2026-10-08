import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  className?: string;
  id?: string;
}

/** Section heading: small uppercase eyebrow, compact title, optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  as: Tag = "h2",
  className,
  id,
}: SectionHeadingProps) {
  const center = align === "center";
  return (
    <div className={cn("flex flex-col gap-1.5", center && "items-center text-center", className)}>
      <span className="eyebrow">{eyebrow}</span>
      <Tag id={id} className={cn("max-w-3xl text-xl md:text-2xl", tone === "dark" && "text-on-ink")}>
        {title}
      </Tag>
      {lead && (
        <p className={cn("max-w-2xl text-sm", tone === "dark" ? "text-on-ink-muted" : "text-muted")}>{lead}</p>
      )}
    </div>
  );
}
