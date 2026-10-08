"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useIsActive, type NavItem } from "./BottomNav";

interface SidebarProps {
  items: NavItem[];
  label: string;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onNavigate?: () => void;
}

/** Vertical nav used by the admin portal. */
export function Sidebar({ items, label, header, footer, className, onNavigate }: SidebarProps) {
  const isActive = useIsActive();
  return (
    <aside className={cn("flex h-full w-60 flex-col border-r border-border bg-surface", className)}>
      {header && <div className="flex h-14 items-center border-b border-border px-4">{header}</div>}
      <nav aria-label={label} className="flex-1 overflow-y-auto p-2.5">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-control px-3 text-sm transition-colors focus-ring",
                    active ? "bg-accent font-medium text-on-accent" : "text-text hover:bg-surface-muted hover:text-primary",
                  )}
                >
                  <Icon size={16} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {footer && <div className="border-t border-border p-2.5">{footer}</div>}
    </aside>
  );
}
