"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should mark this item active. */
  match?: string[];
  /** Only active on this exact path (for section roots like /admin). */
  exact?: boolean;
}

export function useIsActive() {
  const pathname = usePathname();
  return (item: Pick<NavItem, "href" | "match" | "exact">) =>
    item.exact
      ? pathname === item.href
      : [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

interface BottomNavProps {
  items: NavItem[];
  label: string;
  /** Render in document flow (style guide preview) instead of fixed to the viewport. */
  inline?: boolean;
}

export function BottomNav({ items, label, inline = false }: BottomNavProps) {
  const isActive = useIsActive();
  return (
    <nav
      aria-label={label}
      className={cn(
        "border-t border-border bg-surface",
        !inline && "fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                  active ? "font-semibold text-accent" : "text-muted hover:text-accent",
                )}
              >
                <Icon size={18} aria-hidden strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
