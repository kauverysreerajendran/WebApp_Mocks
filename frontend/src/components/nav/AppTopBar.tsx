"use client";

import { Bell, Menu } from "lucide-react";
import { strings } from "@/i18n";

interface AppTopBarProps {
  title: string;
  onMenu?: () => void;
  onNotifications?: () => void;
  unreadCount?: number;
}

/** Mobile app-style top bar: hamburger | title | bell. Used by the tailor portal. */
export function AppTopBar({ title, onMenu, onNotifications, unreadCount = 0 }: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface text-primary">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-2">
        <button
          type="button"
          onClick={onMenu}
          aria-label={strings.common.menu}
          className="inline-flex size-10 items-center justify-center rounded-control text-text hover:bg-surface-muted focus-ring"
        >
          <Menu size={18} aria-hidden />
        </button>
        <h1 className="truncate text-base font-semibold text-primary">{title}</h1>
        <button
          type="button"
          onClick={onNotifications}
          aria-label={
            unreadCount > 0 ? `${strings.common.notifications} (${unreadCount})` : strings.common.notifications
          }
          className="relative inline-flex size-10 items-center justify-center rounded-control text-text hover:bg-surface-muted focus-ring"
        >
          <Bell size={18} aria-hidden />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-on-accent"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
