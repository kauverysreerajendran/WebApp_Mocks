"use client";

import { Bell, CalendarDays, ChevronDown, ClipboardList, House, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Search, Tags, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AppTopBar } from "@/components/nav/AppTopBar";
import { BottomNav, useIsActive, type NavItem } from "@/components/nav/BottomNav";
import { Drawer } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import { sessions } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/hooks/useApi";
import { displayName, useTailor } from "./TailorContext";

const n = strings.nav.tailor;
const p = strings.tailorPortal;

/** Desktop sidebar menu: Dashboard · Orders · Calendar · Earnings · Profile. */
const SIDE_NAV: NavItem[] = [
  { href: routes.tailor.dashboard, label: p.nav.dashboard, icon: LayoutDashboard },
  { href: routes.tailor.orders, label: p.nav.orders, icon: ClipboardList, match: [routes.tailor.completed] },
  { href: routes.tailor.availability, label: p.nav.calendar, icon: CalendarDays },
  { href: routes.tailor.wallet, label: p.nav.earnings, icon: Wallet },
  { href: routes.tailor.profile, label: p.nav.profile, icon: User, match: [routes.tailor.pricing] },
];

/** Mobile bottom bar from the client brief: Home | Orders | Wallet | Profile. */
const BOTTOM_NAV: NavItem[] = [
  { href: routes.tailor.dashboard, label: n.home, icon: House },
  { href: routes.tailor.orders, label: n.orders, icon: ClipboardList, match: [routes.tailor.completed] },
  { href: routes.tailor.wallet, label: n.wallet, icon: Wallet },
  { href: routes.tailor.profile, label: n.profile, icon: User, match: [routes.tailor.availability, routes.tailor.pricing] },
];

const DRAWER_NAV: NavItem[] = [...SIDE_NAV, { href: routes.tailor.pricing, label: n.pricing, icon: Tags }];

function useLogout() {
  const router = useRouter();
  return () => {
    sessions.tailor.set(null);
    router.replace(routes.tailor.login);
  };
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const isActive = useIsActive();
  return (
    <ul className="flex flex-col gap-1">
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
                active ? "bg-accent-soft font-medium text-accent" : "text-text hover:bg-surface-muted",
              )}
            >
              <Icon size={16} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LogoutButton({ className, compact }: { className?: string; compact?: boolean }) {
  const logout = useLogout();
  return (
    <button
      type="button"
      onClick={logout}
      title={compact ? strings.common.logout : undefined}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-control px-3 text-sm text-text hover:bg-error-soft hover:text-error focus-ring",
        className,
      )}
    >
      <LogOut size={16} aria-hidden className="shrink-0" />
      <span className={cn(compact && "sr-only")}>{strings.common.logout}</span>
    </button>
  );
}

function AccountMenu() {
  const { profile } = useTailor();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = displayName(profile)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = "flex h-8 w-full items-center gap-2 rounded-control px-2.5 text-sm focus-ring";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={p.account}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm text-text hover:bg-surface-muted focus-ring"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {initials}
        </span>
        <span className="max-w-40 truncate font-medium">{displayName(profile)}</span>
        <ChevronDown size={14} aria-hidden className="text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1.5 w-48 rounded-card border border-border bg-surface p-1.5 shadow-modal">
          <Link role="menuitem" href={routes.tailor.profile} onClick={() => setOpen(false)} className={cn(item, "text-text hover:bg-surface-muted")}>
            <User size={15} aria-hidden /> {p.nav.profile}
          </Link>
          <Link role="menuitem" href={routes.tailor.pricing} onClick={() => setOpen(false)} className={cn(item, "text-text hover:bg-surface-muted")}>
            <Tags size={15} aria-hidden /> {n.pricing}
          </Link>
          <button role="menuitem" type="button" onClick={logout} className={cn(item, "text-error hover:bg-error-soft")}>
            <LogOut size={15} aria-hidden /> {strings.common.logout}
          </button>
        </div>
      )}
    </div>
  );
}

/** Brand mark for the sidebar: a lotus line icon beside the brand name and "Tailor Portal". */
function SidebarBrand({ compact }: { compact?: boolean }) {
  return (
    <Link href={routes.tailor.dashboard} aria-label={compact ? strings.brand.name : undefined} className="flex items-center gap-2 rounded-control focus-ring">
      <svg viewBox="0 0 32 24" className="h-6 w-8 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
        <path d="M16 3c-3 3.2-4.4 7-4.4 10.2 0 3.6 1.9 6.4 4.4 7.8 2.5-1.4 4.4-4.2 4.4-7.8C20.4 10 19 6.2 16 3Z" />
        <path d="M11.8 10.4C8.6 9 5.6 9 3 10c1.1 5.4 5.6 9.8 13 11" />
        <path d="M20.2 10.4c3.2-1.4 6.2-1.4 8.8-.4-1.1 5.4-5.6 9.8-13 11" />
        <path d="M7.6 9.4c.2-1.8.8-3.4 1.8-4.8 1.5.6 2.8 1.6 3.8 2.9M24.4 9.4c-.2-1.8-.8-3.4-1.8-4.8-1.5.6-2.8 1.6-3.8 2.9" />
      </svg>
      <span className={cn("flex flex-col leading-none", compact && "sr-only")}>
        <span className="text-[1.0625rem] font-semibold whitespace-nowrap text-primary">{strings.brand.name}</span>
        <span className="mt-1 text-[0.5rem] tracking-[0.22em] text-muted uppercase">{p.portalName}</span>
      </span>
    </Link>
  );
}

const SIDEBAR_KEY = "tailor-sidebar-expanded";

/**
 * Desktop left sidebar. Starts collapsed to an icon rail (labels as tooltips); the toggle expands it to
 * brand + labels with the floral artwork at the bottom, and the choice is remembered on this device.
 */
function DesktopSidebar() {
  const isActive = useIsActive();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the saved choice after hydration
      setExpanded(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* storage blocked: stay collapsed */
    }
  }, []);
  const toggle = () =>
    setExpanded((open) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, open ? "0" : "1");
      } catch {
        /* storage blocked: the choice lasts for this visit only */
      }
      return !open;
    });
  const ToggleIcon = expanded ? PanelLeftClose : PanelLeftOpen;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border/70 bg-[#fffbf9] bg-no-repeat transition-[width] duration-200 lg:flex",
        expanded ? "w-52" : "w-16",
      )}
      style={
        expanded
          ? {
              // Whitish wash over the top so the menu reads on white; the artwork shows only near the bottom.
              backgroundImage: `linear-gradient(to bottom, #fffbf9 0%, #fffbf9 38%, rgb(255 251 249 / 0) 62%), url(${media.tailorSidebar.src})`,
              backgroundSize: "100% 100%, 205% auto",
              backgroundPosition: "0 0, left bottom",
            }
          : undefined
      }
    >
      <div className={cn("flex items-center pt-4 pb-5", expanded ? "justify-between gap-2 pr-2 pl-5" : "flex-col gap-3 px-3")}>
        <SidebarBrand compact={!expanded} />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? p.collapseMenu : p.expandMenu}
          title={expanded ? p.collapseMenu : p.expandMenu}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-muted hover:text-text focus-ring"
        >
          <ToggleIcon size={17} strokeWidth={1.7} aria-hidden />
        </button>
      </div>
      <nav aria-label={strings.nav.primary} className={expanded ? "px-3" : "px-2.5"}>
        <ul className="flex flex-col gap-1">
          {SIDE_NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={expanded ? undefined : item.label}
                  title={expanded ? undefined : item.label}
                  className={cn(
                    "flex h-10 items-center rounded-control text-sm transition-colors focus-ring",
                    expanded ? "gap-3 px-3" : "justify-center",
                    active ? "bg-accent-soft font-medium text-accent" : "text-text hover:bg-surface-muted",
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.7} aria-hidden className="shrink-0" />
                  {expanded && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={cn("mt-auto pb-4", expanded ? "px-3" : "px-2.5")}>
        <LogoutButton compact={!expanded} className={expanded ? "bg-white/70 backdrop-blur-sm" : "justify-center px-0"} />
      </div>
    </aside>
  );
}

/** Desktop top bar: order search, notifications and the account menu. */
function DesktopTopBar({ unread }: { unread: number }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-20 hidden h-14 items-center gap-4 bg-surface/35 px-6 backdrop-blur-[2px] lg:flex">
      <form
        role="search"
        className="relative w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q.trim() ? `${routes.tailor.orders}?q=${encodeURIComponent(q.trim())}` : routes.tailor.orders);
        }}
      >
        <label htmlFor="portal-search" className="sr-only">
          {p.globalSearch}
        </label>
        <Search size={15} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          id="portal-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={p.globalSearch}
          className="h-9 w-full rounded-control border border-transparent bg-surface/90 pr-3 pl-9 text-sm shadow-card placeholder:text-muted hover:border-border focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 focus:outline-none"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`${routes.tailor.orders}?tab=new`}
          aria-label={unread ? `${strings.common.notifications} (${unread})` : strings.common.notifications}
          className="relative inline-flex size-9 items-center justify-center rounded-full text-text hover:bg-surface-muted focus-ring"
        >
          <Bell size={18} aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] leading-4 font-semibold text-on-accent">
              {unread}
            </span>
          )}
        </Link>
        <AccountMenu />
      </div>
    </header>
  );
}

const TITLES: [string, string][] = [
  [routes.tailor.dashboard, strings.tailor.dashboardTitle],
  [routes.tailor.completed, strings.tailor.completedTitle],
  [routes.tailor.orders, strings.tailor.ordersTitle],
  [routes.tailor.availability, n.availability],
  [routes.tailor.pricing, n.pricing],
  [routes.tailor.wallet, strings.tailor.walletTitle],
  [routes.tailor.profile, strings.tailor.profileTitle],
];

function MobileHeader({ unread }: { unread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useTailor();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = /^\/tailor\/orders\/\d+/.test(pathname)
    ? strings.tailor.orderDetailsTitle
    : (TITLES.find(([path]) => pathname.startsWith(path))?.[1] ?? strings.tailor.dashboardTitle);
  return (
    <div className="lg:hidden">
      <AppTopBar
        title={title}
        onMenu={() => setMenuOpen(true)}
        onNotifications={() => router.push(`${routes.tailor.orders}?tab=new`)}
        unreadCount={unread}
      />
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={displayName(profile)} side="left">
        <nav aria-label={strings.nav.primary} className="-mx-2">
          <NavList items={DRAWER_NAV} onNavigate={() => setMenuOpen(false)} />
          <div className="mt-2 border-t border-border pt-2">
            <LogoutButton />
          </div>
        </nav>
      </Drawer>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: summary } = useApi(`tailor-dashboard-badge:${pathname}`, tailorApi.dashboard);
  const unread = summary?.unreadNotifications ?? 0;
  return (
    <div className="flex min-h-dvh bg-background">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DesktopTopBar unread={unread} />
        <MobileHeader unread={unread} />
        {/* `relative` so a page can lay a full-width banner behind its header (Dashboard). */}
        <main id="main" className="relative isolate w-full flex-1 overflow-x-clip px-4 pt-4 pb-24 lg:px-6 lg:pt-5 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <div className="lg:hidden">
          <BottomNav items={BOTTOM_NAV} label={strings.nav.primary} />
        </div>
      </div>
    </div>
  );
}

/** Tailor portal frame: left sidebar + top bar on desktop, compact top bar + bottom nav on phones (brief). */
export function TailorShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppTopBar title={strings.tailor.dashboardTitle} />}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}
