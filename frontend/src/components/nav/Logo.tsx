import Link from "next/link";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

interface LogoProps {
  href?: string;
  tone?: "dark" | "light";
  /** Replaces the brand tagline under the name (e.g. "Tailor Portal"). */
  tagline?: string;
  className?: string;
}

/** Placeholder logo: a dashed "Logo" box beside the brand name — swap for the real mark. */
export function Logo({ href = "/", tone = "dark", tagline, className }: LogoProps) {
  const dark = tone === "dark";
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-control focus-ring", className)}>
      <span
        className={cn(
          "inline-flex h-8 w-11 items-center justify-center rounded-control border border-dashed text-[0.5625rem] font-semibold tracking-[0.14em] uppercase",
          dark ? "border-border-strong bg-surface-muted text-muted" : "border-white/40 text-on-ink-muted",
        )}
      >
        {strings.brand.logoMark}
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("text-[1.375rem] leading-none font-medium whitespace-nowrap", dark ? "text-primary" : "text-on-ink")}>
          {strings.brand.name}
        </span>
        <span className={cn("mt-1 text-[0.5rem] tracking-[0.22em] uppercase", dark ? "text-muted" : "text-on-ink-muted")}>
          {tagline ?? strings.brand.logoTagline}
        </span>
      </span>
    </Link>
  );
}
